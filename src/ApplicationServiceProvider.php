<?php

declare(strict_types=1);

namespace NeNeConcierge;

use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;

/**
 * Application-level DI root.
 *
 * Register domain ServiceProviders, RouteRegistrars, and ExceptionHandlers here.
 * Phase 0: no domain modules yet — lists are empty until Phase 1.
 */
final readonly class ApplicationServiceProvider implements ServiceProviderInterface
{
    public const EXCEPTION_HANDLERS = 'nene-concierge.exception_handlers';
    public const ROUTE_REGISTRARS   = 'nene-concierge.route_registrars';

    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                self::EXCEPTION_HANDLERS,
                static fn (): array => [],
            )
            ->set(
                self::ROUTE_REGISTRARS,
                static fn (): array => [],
            );
    }
}
