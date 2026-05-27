<?php

declare(strict_types=1);

namespace NeNeConcierge;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\RequestScopedHolder;
use NeNeConcierge\Auth\AuthRouteRegistrar;
use NeNeConcierge\Auth\AuthServiceProvider;
use NeNeConcierge\Auth\InvalidCredentialsExceptionHandler;
use NeNeConcierge\Organization\OrganizationNotFoundExceptionHandler;
use NeNeConcierge\Organization\OrganizationRouteRegistrar;
use NeNeConcierge\Organization\OrganizationServiceProvider;
use NeNeConcierge\Organization\OrganizationSlugConflictExceptionHandler;
use Psr\Container\ContainerInterface;

/**
 * Application-level DI root.
 *
 * Registers domain ServiceProviders, RouteRegistrars, and ExceptionHandlers.
 */
final readonly class ApplicationServiceProvider implements ServiceProviderInterface
{
    public const EXCEPTION_HANDLERS = 'nene-concierge.exception_handlers';
    public const ROUTE_REGISTRARS   = 'nene-concierge.route_registrars';
    public const ORG_ID_HOLDER      = 'nene-concierge.org_id_holder';

    public function register(ContainerBuilder $builder): void
    {
        $builder->addProvider(new AuthServiceProvider());
        $builder->addProvider(new OrganizationServiceProvider());

        $builder
            ->set(
                self::ORG_ID_HOLDER,
                static fn (ContainerInterface $c): RequestScopedHolder => new RequestScopedHolder(),
            )
            ->set(
                self::EXCEPTION_HANDLERS,
                static function (ContainerInterface $c): array {
                    $invalidCredentials = $c->get(InvalidCredentialsExceptionHandler::class);
                    $orgNotFound        = $c->get(OrganizationNotFoundExceptionHandler::class);
                    $orgSlugConflict    = $c->get(OrganizationSlugConflictExceptionHandler::class);

                    if (!$invalidCredentials instanceof InvalidCredentialsExceptionHandler) {
                        throw new LogicException('InvalidCredentialsExceptionHandler service is invalid.');
                    }

                    if (!$orgNotFound instanceof OrganizationNotFoundExceptionHandler) {
                        throw new LogicException('OrganizationNotFoundExceptionHandler service is invalid.');
                    }

                    if (!$orgSlugConflict instanceof OrganizationSlugConflictExceptionHandler) {
                        throw new LogicException('OrganizationSlugConflictExceptionHandler service is invalid.');
                    }

                    return [$invalidCredentials, $orgNotFound, $orgSlugConflict];
                },
            )
            ->set(
                self::ROUTE_REGISTRARS,
                static function (ContainerInterface $c): array {
                    $auth = $c->get('nene-concierge.route_registrar.auth');
                    $org  = $c->get(OrganizationRouteRegistrar::class);

                    if (!$auth instanceof AuthRouteRegistrar) {
                        throw new LogicException('AuthRouteRegistrar service is invalid.');
                    }

                    if (!$org instanceof OrganizationRouteRegistrar) {
                        throw new LogicException('OrganizationRouteRegistrar service is invalid.');
                    }

                    return [$auth, $org];
                },
            );
    }
}
