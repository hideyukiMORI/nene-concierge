<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests;

use NeNeConcierge\Http\RuntimeContainerFactory;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7Server\ServerRequestCreator;
use PHPUnit\Framework\TestCase;
use Psr\Http\Server\RequestHandlerInterface;

final class HealthTest extends TestCase
{
    public function testHealthEndpointReturnsOk(): void
    {
        $projectRoot = dirname(__DIR__);

        // Load .env.example as .env when .env does not exist (CI)
        if (!file_exists($projectRoot . '/.env') && file_exists($projectRoot . '/.env.example')) {
            copy($projectRoot . '/.env.example', $projectRoot . '/.env');
        }

        $container = (new RuntimeContainerFactory($projectRoot))->create();
        $psr17 = $container->get(Psr17Factory::class);
        assert($psr17 instanceof Psr17Factory);

        $creator = new ServerRequestCreator($psr17, $psr17, $psr17, $psr17);
        $request = $creator->fromArrays(
            ['REQUEST_METHOD' => 'GET', 'REQUEST_URI' => '/health', 'SERVER_NAME' => 'localhost'],
        );

        $app = $container->get(RequestHandlerInterface::class);
        assert($app instanceof RequestHandlerInterface);

        $response = $app->handle($request);

        self::assertSame(200, $response->getStatusCode());

        $body = json_decode((string) $response->getBody(), true);
        self::assertIsArray($body);
        self::assertSame('ok', $body['status']);
    }
}
