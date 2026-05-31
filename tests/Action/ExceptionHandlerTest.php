<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Action;

use Nene2\Error\ProblemDetailsResponseFactory;
use NeNeConcierge\Action\ActionCredentialNotFoundException;
use NeNeConcierge\Action\ActionCredentialNotFoundExceptionHandler;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class ExceptionHandlerTest extends TestCase
{
    private Psr17Factory $psr17;
    private ProblemDetailsResponseFactory $problemDetails;

    protected function setUp(): void
    {
        $this->psr17          = new Psr17Factory();
        $this->problemDetails = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
    }

    public function testCredentialNotFoundSupportsCorrectException(): void
    {
        $handler = new ActionCredentialNotFoundExceptionHandler($this->problemDetails);

        self::assertTrue($handler->supports(new ActionCredentialNotFoundException(1)));
        self::assertFalse($handler->supports(new RuntimeException()));
    }

    public function testCredentialNotFoundReturns404(): void
    {
        $handler  = new ActionCredentialNotFoundExceptionHandler($this->problemDetails);
        $req      = $this->psr17->createServerRequest('GET', '/api/v1/credentials/1');
        $response = $handler->handle(new ActionCredentialNotFoundException(42), $req);

        self::assertSame(404, $response->getStatusCode());
        self::assertStringContainsString('problem+json', $response->getHeaderLine('Content-Type'));
    }
}
