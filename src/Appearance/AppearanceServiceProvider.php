<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class AppearanceServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            // ── Repository ─────────────────────────────────────────────────────
            ->set(
                AppearanceRepositoryInterface::class,
                static function (ContainerInterface $c): AppearanceRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoAppearanceRepository($query);
                },
            )
            // ── Use cases ──────────────────────────────────────────────────────
            ->set(
                GetAppearanceUseCase::class,
                static function (ContainerInterface $c): GetAppearanceUseCase {
                    $repo = $c->get(AppearanceRepositoryInterface::class);

                    if (!$repo instanceof AppearanceRepositoryInterface) {
                        throw new LogicException('Appearance repository service is invalid.');
                    }

                    return new GetAppearanceUseCase($repo);
                },
            )
            ->set(
                UpsertAppearanceUseCase::class,
                static function (ContainerInterface $c): UpsertAppearanceUseCase {
                    $repo = $c->get(AppearanceRepositoryInterface::class);

                    if (!$repo instanceof AppearanceRepositoryInterface) {
                        throw new LogicException('Appearance repository service is invalid.');
                    }

                    return new UpsertAppearanceUseCase($repo);
                },
            )
            // ── Handlers ───────────────────────────────────────────────────────
            ->set(
                GetAppearanceHandler::class,
                static function (ContainerInterface $c): GetAppearanceHandler {
                    $uc   = $c->get(GetAppearanceUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetAppearanceUseCase) {
                        throw new LogicException('GetAppearance use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetAppearanceHandler($uc, $json);
                },
            )
            ->set(
                UpsertAppearanceHandler::class,
                static function (ContainerInterface $c): UpsertAppearanceHandler {
                    $get    = $c->get(GetAppearanceUseCase::class);
                    $upsert = $c->get(UpsertAppearanceUseCase::class);
                    $json   = $c->get(JsonResponseFactory::class);

                    if (!$get instanceof GetAppearanceUseCase) {
                        throw new LogicException('GetAppearance use case service is invalid.');
                    }

                    if (!$upsert instanceof UpsertAppearanceUseCase) {
                        throw new LogicException('UpsertAppearance use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpsertAppearanceHandler($get, $upsert, $json);
                },
            )
            ->set(
                PublicGetAppearanceHandler::class,
                static function (ContainerInterface $c): PublicGetAppearanceHandler {
                    $uc   = $c->get(GetAppearanceUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetAppearanceUseCase) {
                        throw new LogicException('GetAppearance use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new PublicGetAppearanceHandler($uc, $json);
                },
            )
            // ── Route registrar ────────────────────────────────────────────────
            ->set(
                AppearanceRouteRegistrar::class,
                static function (ContainerInterface $c): AppearanceRouteRegistrar {
                    $get       = $c->get(GetAppearanceHandler::class);
                    $upsert    = $c->get(UpsertAppearanceHandler::class);
                    $publicGet = $c->get(PublicGetAppearanceHandler::class);

                    if (!$get instanceof GetAppearanceHandler) {
                        throw new LogicException('GetAppearance handler service is invalid.');
                    }

                    if (!$upsert instanceof UpsertAppearanceHandler) {
                        throw new LogicException('UpsertAppearance handler service is invalid.');
                    }

                    if (!$publicGet instanceof PublicGetAppearanceHandler) {
                        throw new LogicException('PublicGetAppearance handler service is invalid.');
                    }

                    return new AppearanceRouteRegistrar($get, $upsert, $publicGet);
                },
            );
    }
}
