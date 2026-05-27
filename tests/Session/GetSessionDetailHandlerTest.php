<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Session;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use NeNeConcierge\Session\ChatSession;
use NeNeConcierge\Session\GetSessionDetailHandler;
use NeNeConcierge\Session\MessageRole;
use NeNeConcierge\Session\SessionMessage;
use NeNeConcierge\Session\SessionOutcome;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

final class GetSessionDetailHandlerTest extends TestCase
{
    private InMemoryChatSessionRepository    $sessions;
    private InMemorySessionMessageRepository $messages;
    private GetSessionDetailHandler          $handler;
    private Psr17Factory                     $psr17;

    protected function setUp(): void
    {
        $this->psr17    = new Psr17Factory();
        $this->sessions = new InMemoryChatSessionRepository();
        $this->messages = new InMemorySessionMessageRepository();
        $this->handler  = new GetSessionDetailHandler(
            $this->sessions,
            $this->messages,
            new JsonResponseFactory($this->psr17, $this->psr17),
            new ProblemDetailsResponseFactory($this->psr17, $this->psr17),
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeSession(int $orgId, string $id = 'sess-abc'): ChatSession
    {
        return new ChatSession(
            id:             $id,
            organizationId: $orgId,
            scenarioId:     1,
            currentNodeId:  null,
            outcome:        SessionOutcome::Completed,
            hasConversion:  true,
            startedAt:      '2026-05-01 10:00:00',
            variables:      ['name' => 'Alice', 'email' => 'alice@example.com'],
            endedAt:        '2026-05-01 10:05:00',
        );
    }

    private function makeRequest(int $orgId = 1, string $sessionId = 'sess-abc'): ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('GET', '/api/v1/sessions/' . $sessionId)
            ->withAttribute('nene2.org.id', $orgId)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['session_id' => $sessionId]);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    public function testReturns404ForUnknownSession(): void
    {
        $response = $this->handler->handle($this->makeRequest(1, 'no-such-session'));

        $this->assertSame(404, $response->getStatusCode());
        $this->assertStringContainsString('problem+json', $response->getHeaderLine('Content-Type'));
    }

    public function testReturns404ForWrongOrganization(): void
    {
        $this->sessions->save($this->makeSession(2, 'sess-abc')); // org 2

        $response = $this->handler->handle($this->makeRequest(1, 'sess-abc')); // query as org 1

        $this->assertSame(404, $response->getStatusCode());
    }

    public function testReturnsSessionDetails(): void
    {
        $this->sessions->save($this->makeSession(1, 'sess-abc'));

        $response = $this->handler->handle($this->makeRequest(1, 'sess-abc'));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertSame(200, $response->getStatusCode());
        $data = $body['data'];

        $this->assertSame('sess-abc', $data['id']);
        $this->assertSame(1, $data['scenario_id']);
        $this->assertSame('completed', $data['outcome']);
        $this->assertTrue($data['has_conversion']);
        $this->assertSame('2026-05-01 10:00:00', $data['started_at']);
        $this->assertSame('2026-05-01 10:05:00', $data['ended_at']);
        $this->assertSame(['name' => 'Alice', 'email' => 'alice@example.com'], $data['variables']);
        $this->assertSame([], $data['messages']);
    }

    public function testReturnsMessagesInOrder(): void
    {
        $this->sessions->save($this->makeSession(1, 'sess-abc'));

        $this->messages->append(new SessionMessage(
            sessionId:      'sess-abc',
            organizationId: 1,
            role:           MessageRole::Bot,
            content:        'Hello, how can I help?',
            createdAt:      '2026-05-01 10:00:01',
            nodeId:         'node-01',
        ));
        $this->messages->append(new SessionMessage(
            sessionId:      'sess-abc',
            organizationId: 1,
            role:           MessageRole::Visitor,
            content:        'I need support.',
            createdAt:      '2026-05-01 10:00:30',
            nodeId:         null,
        ));

        $response = $this->handler->handle($this->makeRequest(1, 'sess-abc'));
        $body     = json_decode((string) $response->getBody(), true);

        $messages = $body['data']['messages'];
        $this->assertCount(2, $messages);

        $this->assertSame('bot', $messages[0]['role']);
        $this->assertSame('Hello, how can I help?', $messages[0]['content']);
        $this->assertSame('node-01', $messages[0]['node_id']);
        $this->assertArrayHasKey('id', $messages[0]);
        $this->assertArrayHasKey('created_at', $messages[0]);

        $this->assertSame('visitor', $messages[1]['role']);
        $this->assertNull($messages[1]['node_id']);
    }

    public function testMessagesFromDifferentSessionNotIncluded(): void
    {
        $this->sessions->save($this->makeSession(1, 'sess-abc'));
        $this->sessions->save($this->makeSession(1, 'sess-xyz'));

        $this->messages->append(new SessionMessage(
            sessionId:      'sess-xyz', // different session
            organizationId: 1,
            role:           MessageRole::Bot,
            content:        'Other session message',
            createdAt:      '2026-05-01 10:00:01',
        ));

        $response = $this->handler->handle($this->makeRequest(1, 'sess-abc'));
        $body     = json_decode((string) $response->getBody(), true);

        $this->assertSame([], $body['data']['messages']);
    }
}
