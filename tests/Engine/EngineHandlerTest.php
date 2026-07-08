<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Engine;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationException;
use NeNeConcierge\Action\ActionDispatcher;
use NeNeConcierge\Action\ActionLogRepositoryInterface;
use NeNeConcierge\Engine\ConditionEvaluator;
use NeNeConcierge\Engine\EngineException;
use NeNeConcierge\Engine\EngineExceptionHandler;
use NeNeConcierge\Engine\PreviewStartHandler;
use NeNeConcierge\Engine\PreviewStepHandler;
use NeNeConcierge\Engine\ScenarioEngine;
use NeNeConcierge\Engine\StartSessionHandler;
use NeNeConcierge\Engine\StepSessionHandler;
use NeNeConcierge\Engine\VariableInterpolator;
use NeNeConcierge\Scenario\Scenario;
use NeNeConcierge\Scenario\ScenarioEdge;
use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioEdgeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioNodeRepository;
use NeNeConcierge\Tests\Scenario\InMemoryScenarioRepository;
use NeNeConcierge\Tests\Support\FixedClock;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;
use RuntimeException;

final class EngineHandlerTest extends TestCase
{
    private Psr17Factory                       $psr17;
    private JsonResponseFactory                $json;
    private InMemoryScenarioRepository         $scenarioRepo;
    private InMemoryScenarioNodeRepository     $nodeRepo;
    private InMemoryScenarioEdgeRepository     $edgeRepo;
    private InMemoryChatSessionRepository      $sessionRepo;
    private InMemorySessionNodeEventRepository $eventRepo;
    private ScenarioEngine                     $engine;

    protected function setUp(): void
    {
        $this->psr17        = new Psr17Factory();
        $this->json         = new JsonResponseFactory($this->psr17, $this->psr17);
        $this->scenarioRepo = new InMemoryScenarioRepository();
        $this->nodeRepo     = new InMemoryScenarioNodeRepository();
        $this->edgeRepo     = new InMemoryScenarioEdgeRepository();
        $this->sessionRepo  = new InMemoryChatSessionRepository();
        $this->eventRepo    = new InMemorySessionNodeEventRepository();
        $this->engine       = new ScenarioEngine(
            $this->scenarioRepo,
            $this->nodeRepo,
            $this->edgeRepo,
            $this->sessionRepo,
            $this->eventRepo,
            new ConditionEvaluator(),
            new VariableInterpolator(),
            new ActionDispatcher([], $this->createStub(ActionLogRepositoryInterface::class), new FixedClock()),
            new FixedClock(),
        );
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function seedTwoNodeScenario(int $orgId = 1): int
    {
        $sid = $this->scenarioRepo->save(new Scenario('S', ScenarioStatus::Published, $orgId));

        $msg = new ScenarioNode('msg', $sid, $orgId, ScenarioNodeType::Message, 'Hello', []);
        $end = new ScenarioNode('end', $sid, $orgId, ScenarioNodeType::End, 'Bye', []);
        $this->nodeRepo->replaceAll($sid, $orgId, [$msg, $end]);
        $this->edgeRepo->replaceAll($sid, $orgId, [
            new ScenarioEdge($sid, $orgId, 'msg', 'end'),
        ]);

        return $sid;
    }

    /** @param array<string, mixed> $body */
    private function postBodyReq(string $url, array $body, int $orgId = 1): ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('POST', $url)
            ->withParsedBody($body)
            ->withAttribute('nene2.org.id', $orgId);
    }

    /** @param array<string, mixed> $body */
    private function postJsonReq(string $url, array $body, string $sessionId, int $orgId = 1): ServerRequestInterface
    {
        // 空配列は json_encode で "[]" になり JsonBodyParseException になるため {} に変換
        $encoded = json_encode($body === [] ? new \stdClass() : $body);

        return $this->psr17
            ->createServerRequest('POST', $url)
            ->withBody($this->psr17->createStream($encoded ?: '{}'))
            ->withHeader('Content-Type', 'application/json')
            ->withAttribute('nene2.org.id', $orgId)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['session_id' => $sessionId]);
    }

    // ── StartSessionHandler ───────────────────────────────────────────────────

    public function testStartSessionReturns201WithNodeAndSessionId(): void
    {
        $sid     = $this->seedTwoNodeScenario();
        $handler = new StartSessionHandler($this->engine, $this->json);

        $response = $handler->handle($this->postBodyReq('/api/v1/public/sessions', ['scenario_id' => $sid]));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(201, $response->getStatusCode());
        self::assertArrayHasKey('session_id', $body);
        self::assertArrayHasKey('node', $body);
        self::assertSame('msg', $body['node']['node_id']);
        self::assertSame('message', $body['node']['type']);
        self::assertFalse($body['node']['is_terminal']);
    }

    public function testStartSessionFallsBackToQueryParamForScenarioId(): void
    {
        $sid     = $this->seedTwoNodeScenario();
        $handler = new StartSessionHandler($this->engine, $this->json);

        // body に scenario_id なし → query param にフォールバック
        $request = $this->psr17
            ->createServerRequest('POST', '/api/v1/public/sessions?scenario_id=' . $sid)
            ->withParsedBody([])
            ->withAttribute('nene2.org.id', 1)
            ->withQueryParams(['scenario_id' => (string) $sid]);

        $response = $handler->handle($request);
        self::assertSame(201, $response->getStatusCode());
    }

    public function testStartSessionResponseContainsChoices(): void
    {
        $sid = $this->scenarioRepo->save(new Scenario('Multi', ScenarioStatus::Published, 1));
        $q   = new ScenarioNode('q', $sid, 1, ScenarioNodeType::Message, 'Pick one', []);
        $a   = new ScenarioNode('a', $sid, 1, ScenarioNodeType::End, 'A', []);
        $b   = new ScenarioNode('b', $sid, 1, ScenarioNodeType::End, 'B', []);
        $this->nodeRepo->replaceAll($sid, 1, [$q, $a, $b]);
        $this->edgeRepo->replaceAll($sid, 1, [
            new ScenarioEdge($sid, 1, 'q', 'a', 'Option A'),
            new ScenarioEdge($sid, 1, 'q', 'b', 'Option B'),
        ]);

        $handler  = new StartSessionHandler($this->engine, $this->json);
        $response = $handler->handle($this->postBodyReq('/api/v1/public/sessions', ['scenario_id' => $sid]));
        $body     = json_decode((string) $response->getBody(), true);

        $choices = $body['node']['choices'];
        self::assertCount(2, $choices);
        self::assertSame('a', $choices[0]['target_node_id']);
        self::assertSame('Option A', $choices[0]['label']);
    }

    // ── StepSessionHandler ────────────────────────────────────────────────────

    public function testStepSessionAdvancesToEndNode(): void
    {
        $sid     = $this->seedTwoNodeScenario();
        $handler = new StepSessionHandler($this->engine, $this->json);

        $startResult = $this->engine->start($sid, 1);
        $response    = $handler->handle($this->postJsonReq(
            '/api/v1/public/sessions/' . $startResult->sessionId . '/step',
            ['target_node_id' => 'end'],
            $startResult->sessionId,
        ));
        $body = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('end', $body['node']['node_id']);
        self::assertTrue($body['node']['is_terminal']);
        self::assertSame('completed', $body['outcome']);
    }

    public function testStepSessionThrowsValidationWhenBothTargetAndAnswerMissing(): void
    {
        $sid         = $this->seedTwoNodeScenario();
        $startResult = $this->engine->start($sid, 1);
        $handler     = new StepSessionHandler($this->engine, $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJsonReq(
            '/api/v1/public/sessions/' . $startResult->sessionId . '/step',
            [],  // neither target_node_id nor answer
            $startResult->sessionId,
        ));
    }

    public function testStepSessionPassesAnswerToEngine(): void
    {
        // collect_variable ノードで answer を渡す
        $sid     = $this->scenarioRepo->save(new Scenario('S', ScenarioStatus::Published, 1));
        $q       = new ScenarioNode('q', $sid, 1, ScenarioNodeType::Message, 'Name?', ['collect_variable' => 'name']);
        $reply   = new ScenarioNode('reply', $sid, 1, ScenarioNodeType::End, 'Hi {{name}}!', []);
        $this->nodeRepo->replaceAll($sid, 1, [$q, $reply]);
        $this->edgeRepo->replaceAll($sid, 1, [new ScenarioEdge($sid, 1, 'q', 'reply')]);

        $startResult = $this->engine->start($sid, 1);
        $handler     = new StepSessionHandler($this->engine, $this->json);
        $response    = $handler->handle($this->postJsonReq(
            '/api/v1/public/sessions/' . $startResult->sessionId . '/step',
            ['target_node_id' => 'reply', 'answer' => 'Alice'],
            $startResult->sessionId,
        ));
        $body = json_decode((string) $response->getBody(), true);

        self::assertSame('Hi Alice!', $body['node']['label']);
    }

    // ── PreviewStartHandler ───────────────────────────────────────────────────

    public function testPreviewStartReturns201(): void
    {
        $sid = $this->seedTwoNodeScenario();
        $handler = new PreviewStartHandler($this->engine, $this->json);

        $request = $this->psr17
            ->createServerRequest('POST', '/api/v1/scenarios/' . $sid . '/preview/start')
            ->withAttribute('nene2.org.id', 1)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['id' => (string) $sid]);

        $response = $handler->handle($request);
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(201, $response->getStatusCode());
        self::assertArrayHasKey('session_id', $body);
        self::assertSame('msg', $body['node']['node_id']);
    }

    // ── PreviewStepHandler ────────────────────────────────────────────────────

    public function testPreviewStepAdvancesSession(): void
    {
        $sid         = $this->seedTwoNodeScenario();
        $startResult = $this->engine->start($sid, 1, preview: true);
        $handler     = new PreviewStepHandler($this->engine, $this->json);

        $request = $this->psr17
            ->createServerRequest('POST', '/api/v1/scenarios/' . $sid . '/preview/step/' . $startResult->sessionId)
            ->withBody($this->psr17->createStream(json_encode(['target_node_id' => 'end']) ?: '{}'))
            ->withHeader('Content-Type', 'application/json')
            ->withAttribute('nene2.org.id', 1)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['session_id' => $startResult->sessionId]);

        $response = $handler->handle($request);
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('end', $body['node']['node_id']);
        self::assertSame('preview', $body['outcome']);
    }

    // ── EngineExceptionHandler ────────────────────────────────────────────────

    public function testEngineExceptionHandlerSupportsEngineException(): void
    {
        $pf      = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
        $handler = new EngineExceptionHandler($pf);

        self::assertTrue($handler->supports(new EngineException('boom')));
        self::assertFalse($handler->supports(new RuntimeException('other')));
    }

    public function testEngineExceptionHandlerReturns422(): void
    {
        $pf       = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
        $handler  = new EngineExceptionHandler($pf);
        $request  = $this->psr17->createServerRequest('POST', '/api/v1/public/sessions');
        $response = $handler->handle(new EngineException('Scenario 1 not found.'), $request);

        self::assertSame(422, $response->getStatusCode());
        self::assertStringContainsString('problem+json', $response->getHeaderLine('Content-Type'));
    }

    public function testEngineExceptionDetailContainsMessage(): void
    {
        $pf       = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
        $handler  = new EngineExceptionHandler($pf);
        $request  = $this->psr17->createServerRequest('POST', '/api/v1/public/sessions');
        $response = $handler->handle(new EngineException('No start node found.'), $request);
        $body     = json_decode((string) $response->getBody(), true);

        self::assertStringContainsString('No start node', $body['detail'] ?? '');
    }
}
