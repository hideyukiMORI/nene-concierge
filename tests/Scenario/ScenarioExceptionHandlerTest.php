<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use Nene2\Error\ProblemDetailsResponseFactory;
use NeNeConcierge\Scenario\ScenarioNotFoundException;
use NeNeConcierge\Scenario\ScenarioNotFoundExceptionHandler;
use NeNeConcierge\Scenario\ScenarioRevisionNotFoundException;
use NeNeConcierge\Scenario\ScenarioRevisionNotFoundExceptionHandler;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class ScenarioExceptionHandlerTest extends TestCase
{
    private Psr17Factory $psr17;
    private ProblemDetailsResponseFactory $problemDetails;

    protected function setUp(): void
    {
        $this->psr17          = new Psr17Factory();
        $this->problemDetails = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
    }

    private function req(): \Psr\Http\Message\ServerRequestInterface
    {
        return $this->psr17->createServerRequest('GET', '/api/v1/scenarios/1');
    }

    // ── ScenarioNotFoundExceptionHandler ─────────────────────────────────────

    public function testScenarioNotFoundSupportsCorrectException(): void
    {
        $handler = new ScenarioNotFoundExceptionHandler($this->problemDetails);

        self::assertTrue($handler->supports(new ScenarioNotFoundException(1)));
        self::assertFalse($handler->supports(new RuntimeException()));
    }

    public function testScenarioNotFoundReturns404(): void
    {
        $handler  = new ScenarioNotFoundExceptionHandler($this->problemDetails);
        $response = $handler->handle(new ScenarioNotFoundException(42), $this->req());

        self::assertSame(404, $response->getStatusCode());
        self::assertStringContainsString('problem+json', $response->getHeaderLine('Content-Type'));
    }

    // ── ScenarioRevisionNotFoundExceptionHandler ──────────────────────────────

    public function testRevisionNotFoundSupportsCorrectException(): void
    {
        $handler = new ScenarioRevisionNotFoundExceptionHandler($this->problemDetails);

        self::assertTrue($handler->supports(new ScenarioRevisionNotFoundException(1)));
        self::assertFalse($handler->supports(new RuntimeException()));
    }

    public function testRevisionNotFoundReturns404(): void
    {
        $handler  = new ScenarioRevisionNotFoundExceptionHandler($this->problemDetails);
        $response = $handler->handle(new ScenarioRevisionNotFoundException(99), $this->req());

        self::assertSame(404, $response->getStatusCode());
    }
}
