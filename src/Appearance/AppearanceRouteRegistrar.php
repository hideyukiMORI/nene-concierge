<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class AppearanceRouteRegistrar
{
    public function __construct(
        private GetAppearanceHandler         $getHandler,
        private UpsertAppearanceHandler      $upsertHandler,
        private PublicGetAppearanceHandler   $publicGetHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $get       = $this->getHandler;
        $upsert    = $this->upsertHandler;
        $publicGet = $this->publicGetHandler;

        $router->get('/api/v1/appearance', static fn (ServerRequestInterface $r) => $get->handle($r));
        $router->put('/api/v1/appearance', static fn (ServerRequestInterface $r) => $upsert->handle($r));
        $router->get('/api/v1/public/appearance', static fn (ServerRequestInterface $r) => $publicGet->handle($r));
    }
}
