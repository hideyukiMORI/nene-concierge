<?php

declare(strict_types=1);

namespace NeNeConcierge;

use LogicException;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\RequestScopedHolder;
use NeNeConcierge\Action\ActionCredentialNotFoundExceptionHandler;
use NeNeConcierge\Action\ActionRouteRegistrar;
use NeNeConcierge\Action\ActionServiceProvider;
use NeNeConcierge\Appearance\AppearanceRouteRegistrar;
use NeNeConcierge\Appearance\AppearanceServiceProvider;
use NeNeConcierge\Auth\AuthRouteRegistrar;
use NeNeConcierge\Auth\AuthServiceProvider;
use NeNeConcierge\Auth\InvalidCredentialsExceptionHandler;
use NeNeConcierge\Auth\UserEmailConflictExceptionHandler;
use NeNeConcierge\Auth\UserNotFoundExceptionHandler;
use NeNeConcierge\Auth\UserOperationForbiddenExceptionHandler;
use NeNeConcierge\Dashboard\DashboardRouteRegistrar;
use NeNeConcierge\Dashboard\DashboardServiceProvider;
use NeNeConcierge\Engine\EngineExceptionHandler;
use NeNeConcierge\Engine\EngineRouteRegistrar;
use NeNeConcierge\Engine\EngineServiceProvider;
use NeNeConcierge\Me\MeRouteRegistrar;
use NeNeConcierge\Me\MeServiceProvider;
use NeNeConcierge\Organization\OrganizationNotFoundExceptionHandler;
use NeNeConcierge\Organization\OrganizationRouteRegistrar;
use NeNeConcierge\Organization\OrganizationServiceProvider;
use NeNeConcierge\Organization\OrganizationSlugConflictExceptionHandler;
use NeNeConcierge\Scenario\ScenarioNotFoundExceptionHandler;
use NeNeConcierge\Scenario\ScenarioRouteRegistrar;
use NeNeConcierge\Scenario\ScenarioServiceProvider;
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
        $builder->addProvider(new ActionServiceProvider());
        $builder->addProvider(new AppearanceServiceProvider());
        $builder->addProvider(new AuthServiceProvider());
        $builder->addProvider(new DashboardServiceProvider());
        $builder->addProvider(new EngineServiceProvider());
        $builder->addProvider(new MeServiceProvider());
        $builder->addProvider(new OrganizationServiceProvider());
        $builder->addProvider(new ScenarioServiceProvider());

        $builder
            ->set(
                self::ORG_ID_HOLDER,
                static fn (ContainerInterface $c): RequestScopedHolder => new RequestScopedHolder(),
            )
            ->set(
                self::EXCEPTION_HANDLERS,
                static function (ContainerInterface $c): array {
                    $actionCredNotFound = $c->get(ActionCredentialNotFoundExceptionHandler::class);
                    $engineError        = $c->get(EngineExceptionHandler::class);
                    $invalidCredentials = $c->get(InvalidCredentialsExceptionHandler::class);
                    $orgNotFound        = $c->get(OrganizationNotFoundExceptionHandler::class);
                    $orgSlugConflict    = $c->get(OrganizationSlugConflictExceptionHandler::class);
                    $scenarioNotFound   = $c->get(ScenarioNotFoundExceptionHandler::class);
                    $userNotFound       = $c->get(UserNotFoundExceptionHandler::class);
                    $userEmailConflict  = $c->get(UserEmailConflictExceptionHandler::class);
                    $userOpForbidden    = $c->get(UserOperationForbiddenExceptionHandler::class);

                    if (!$actionCredNotFound instanceof ActionCredentialNotFoundExceptionHandler) {
                        throw new LogicException('ActionCredentialNotFoundExceptionHandler service is invalid.');
                    }

                    if (!$engineError instanceof EngineExceptionHandler) {
                        throw new LogicException('EngineExceptionHandler service is invalid.');
                    }

                    if (!$invalidCredentials instanceof InvalidCredentialsExceptionHandler) {
                        throw new LogicException('InvalidCredentialsExceptionHandler service is invalid.');
                    }

                    if (!$orgNotFound instanceof OrganizationNotFoundExceptionHandler) {
                        throw new LogicException('OrganizationNotFoundExceptionHandler service is invalid.');
                    }

                    if (!$orgSlugConflict instanceof OrganizationSlugConflictExceptionHandler) {
                        throw new LogicException('OrganizationSlugConflictExceptionHandler service is invalid.');
                    }

                    if (!$scenarioNotFound instanceof ScenarioNotFoundExceptionHandler) {
                        throw new LogicException('ScenarioNotFoundExceptionHandler service is invalid.');
                    }

                    if (!$userNotFound instanceof UserNotFoundExceptionHandler) {
                        throw new LogicException('UserNotFoundExceptionHandler service is invalid.');
                    }

                    if (!$userEmailConflict instanceof UserEmailConflictExceptionHandler) {
                        throw new LogicException('UserEmailConflictExceptionHandler service is invalid.');
                    }

                    if (!$userOpForbidden instanceof UserOperationForbiddenExceptionHandler) {
                        throw new LogicException('UserOperationForbiddenExceptionHandler service is invalid.');
                    }

                    return [
                        $actionCredNotFound,
                        $engineError,
                        $invalidCredentials,
                        $orgNotFound,
                        $orgSlugConflict,
                        $scenarioNotFound,
                        $userNotFound,
                        $userEmailConflict,
                        $userOpForbidden,
                    ];
                },
            )
            ->set(
                self::ROUTE_REGISTRARS,
                static function (ContainerInterface $c): array {
                    $action     = $c->get(ActionRouteRegistrar::class);
                    $appearance = $c->get(AppearanceRouteRegistrar::class);
                    $auth       = $c->get('nene-concierge.route_registrar.auth');
                    $dashboard  = $c->get(DashboardRouteRegistrar::class);
                    $engine     = $c->get(EngineRouteRegistrar::class);
                    $me         = $c->get(MeRouteRegistrar::class);
                    $org        = $c->get(OrganizationRouteRegistrar::class);
                    $scenario   = $c->get(ScenarioRouteRegistrar::class);

                    if (!$action instanceof ActionRouteRegistrar) {
                        throw new LogicException('ActionRouteRegistrar service is invalid.');
                    }

                    if (!$appearance instanceof AppearanceRouteRegistrar) {
                        throw new LogicException('AppearanceRouteRegistrar service is invalid.');
                    }

                    if (!$auth instanceof AuthRouteRegistrar) {
                        throw new LogicException('AuthRouteRegistrar service is invalid.');
                    }

                    if (!$dashboard instanceof DashboardRouteRegistrar) {
                        throw new LogicException('DashboardRouteRegistrar service is invalid.');
                    }

                    if (!$engine instanceof EngineRouteRegistrar) {
                        throw new LogicException('EngineRouteRegistrar service is invalid.');
                    }

                    if (!$me instanceof MeRouteRegistrar) {
                        throw new LogicException('MeRouteRegistrar service is invalid.');
                    }

                    if (!$org instanceof OrganizationRouteRegistrar) {
                        throw new LogicException('OrganizationRouteRegistrar service is invalid.');
                    }

                    if (!$scenario instanceof ScenarioRouteRegistrar) {
                        throw new LogicException('ScenarioRouteRegistrar service is invalid.');
                    }

                    return [$action, $appearance, $auth, $dashboard, $engine, $me, $org, $scenario];
                },
            );
    }
}
