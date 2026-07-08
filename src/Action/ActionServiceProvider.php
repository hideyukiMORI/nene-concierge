<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use NeNeConcierge\Analytics\ScenarioAnalyticsHandler;
use NeNeConcierge\Analytics\ScenarioAnalyticsUseCase;
use NeNeConcierge\Http\CurlHttpClient;
use NeNeConcierge\Http\CurlRequestFactory;
use NeNeConcierge\Http\CurlStreamFactory;
use NeNeConcierge\Scenario\ScenarioRepositoryInterface;
use Psr\Container\ContainerInterface;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;

final readonly class ActionServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            // ── HTTP client + PSR-17 factories ────────────────────────────────
            ->set(
                ClientInterface::class,
                static fn (): ClientInterface => new CurlHttpClient(),
            )
            ->set(
                RequestFactoryInterface::class,
                static fn (): RequestFactoryInterface => new CurlRequestFactory(),
            )
            ->set(
                StreamFactoryInterface::class,
                static fn (): StreamFactoryInterface => new CurlStreamFactory(),
            )
            // ── Action repositories ────────────────────────────────────────────
            ->set(
                ActionLogRepositoryInterface::class,
                static function (ContainerInterface $c): ActionLogRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoActionLogRepository($query);
                },
            )
            ->set(
                ActionCredentialRepositoryInterface::class,
                static function (ContainerInterface $c): ActionCredentialRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoActionCredentialRepository($query);
                },
            )
            // ── Action adapters ────────────────────────────────────────────────
            ->set(
                HttpActionAdapter::class,
                static function (ContainerInterface $c): HttpActionAdapter {
                    $client  = $c->get(ClientInterface::class);
                    $reqFac  = $c->get(RequestFactoryInterface::class);
                    $strFac  = $c->get(StreamFactoryInterface::class);

                    if (!$client instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$reqFac instanceof RequestFactoryInterface) {
                        throw new LogicException('RequestFactory service is invalid.');
                    }

                    if (!$strFac instanceof StreamFactoryInterface) {
                        throw new LogicException('StreamFactory service is invalid.');
                    }

                    return new HttpActionAdapter($client, $reqFac, $strFac);
                },
            )
            ->set(
                EmailActionAdapter::class,
                static function (ContainerInterface $c): EmailActionAdapter {
                    $client  = $c->get(ClientInterface::class);
                    $reqFac  = $c->get(RequestFactoryInterface::class);
                    $strFac  = $c->get(StreamFactoryInterface::class);

                    if (!$client instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$reqFac instanceof RequestFactoryInterface) {
                        throw new LogicException('RequestFactory service is invalid.');
                    }

                    if (!$strFac instanceof StreamFactoryInterface) {
                        throw new LogicException('StreamFactory service is invalid.');
                    }

                    return new EmailActionAdapter($client, $reqFac, $strFac);
                },
            )
            ->set(
                SlackActionAdapter::class,
                static function (ContainerInterface $c): SlackActionAdapter {
                    $client  = $c->get(ClientInterface::class);
                    $reqFac  = $c->get(RequestFactoryInterface::class);
                    $strFac  = $c->get(StreamFactoryInterface::class);

                    if (!$client instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$reqFac instanceof RequestFactoryInterface) {
                        throw new LogicException('RequestFactory service is invalid.');
                    }

                    if (!$strFac instanceof StreamFactoryInterface) {
                        throw new LogicException('StreamFactory service is invalid.');
                    }

                    return new SlackActionAdapter($client, $reqFac, $strFac);
                },
            )
            ->set(
                ChatworkActionAdapter::class,
                static function (ContainerInterface $c): ChatworkActionAdapter {
                    $client  = $c->get(ClientInterface::class);
                    $reqFac  = $c->get(RequestFactoryInterface::class);
                    $strFac  = $c->get(StreamFactoryInterface::class);

                    if (!$client instanceof ClientInterface) {
                        throw new LogicException('HTTP client service is invalid.');
                    }

                    if (!$reqFac instanceof RequestFactoryInterface) {
                        throw new LogicException('RequestFactory service is invalid.');
                    }

                    if (!$strFac instanceof StreamFactoryInterface) {
                        throw new LogicException('StreamFactory service is invalid.');
                    }

                    return new ChatworkActionAdapter($client, $reqFac, $strFac);
                },
            )
            // ── QR code adapter ────────────────────────────────────────────────
            ->set(
                QrCodeActionAdapter::class,
                static fn (): QrCodeActionAdapter => new QrCodeActionAdapter(),
            )
            // ── Action dispatcher ──────────────────────────────────────────────
            ->set(
                ActionDispatcher::class,
                static function (ContainerInterface $c): ActionDispatcher {
                    $http      = $c->get(HttpActionAdapter::class);
                    $email     = $c->get(EmailActionAdapter::class);
                    $slack     = $c->get(SlackActionAdapter::class);
                    $chatwork  = $c->get(ChatworkActionAdapter::class);
                    $qr        = $c->get(QrCodeActionAdapter::class);
                    $logs      = $c->get(ActionLogRepositoryInterface::class);
                    $clock     = $c->get(ClockInterface::class);

                    if (!$http instanceof HttpActionAdapter) {
                        throw new LogicException('HttpActionAdapter service is invalid.');
                    }

                    if (!$email instanceof EmailActionAdapter) {
                        throw new LogicException('EmailActionAdapter service is invalid.');
                    }

                    if (!$slack instanceof SlackActionAdapter) {
                        throw new LogicException('SlackActionAdapter service is invalid.');
                    }

                    if (!$chatwork instanceof ChatworkActionAdapter) {
                        throw new LogicException('ChatworkActionAdapter service is invalid.');
                    }

                    if (!$qr instanceof QrCodeActionAdapter) {
                        throw new LogicException('QrCodeActionAdapter service is invalid.');
                    }

                    if (!$logs instanceof ActionLogRepositoryInterface) {
                        throw new LogicException('ActionLog repository service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('ClockInterface service is invalid.');
                    }

                    return new ActionDispatcher([$http, $email, $slack, $chatwork, $qr], $logs, $clock);
                },
            )
            // ── Action credential CRUD handlers ────────────────────────────────
            ->set(
                ListCredentialsHandler::class,
                static function (ContainerInterface $c): ListCredentialsHandler {
                    $repo = $c->get(ActionCredentialRepositoryInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$repo instanceof ActionCredentialRepositoryInterface) {
                        throw new LogicException('ActionCredential repository service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListCredentialsHandler($repo, $json);
                },
            )
            ->set(
                CreateCredentialHandler::class,
                static function (ContainerInterface $c): CreateCredentialHandler {
                    $repo = $c->get(ActionCredentialRepositoryInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$repo instanceof ActionCredentialRepositoryInterface) {
                        throw new LogicException('ActionCredential repository service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CreateCredentialHandler($repo, $json);
                },
            )
            ->set(
                UpdateCredentialHandler::class,
                static function (ContainerInterface $c): UpdateCredentialHandler {
                    $repo = $c->get(ActionCredentialRepositoryInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$repo instanceof ActionCredentialRepositoryInterface) {
                        throw new LogicException('ActionCredential repository service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateCredentialHandler($repo, $json);
                },
            )
            ->set(
                DeleteCredentialHandler::class,
                static function (ContainerInterface $c): DeleteCredentialHandler {
                    $repo = $c->get(ActionCredentialRepositoryInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$repo instanceof ActionCredentialRepositoryInterface) {
                        throw new LogicException('ActionCredential repository service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new DeleteCredentialHandler($repo, $json);
                },
            )
            // ── Exception handler ──────────────────────────────────────────────
            ->set(
                ActionCredentialNotFoundExceptionHandler::class,
                static function (ContainerInterface $c): ActionCredentialNotFoundExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new ActionCredentialNotFoundExceptionHandler($problemDetails);
                },
            )
            // ── Analytics ──────────────────────────────────────────────────────
            ->set(
                ScenarioAnalyticsUseCase::class,
                static function (ContainerInterface $c): ScenarioAnalyticsUseCase {
                    $query     = $c->get(DatabaseQueryExecutorInterface::class);
                    $scenarios = $c->get(ScenarioRepositoryInterface::class);
                    $clock     = $c->get(ClockInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$scenarios instanceof ScenarioRepositoryInterface) {
                        throw new LogicException('Scenario repository service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('ClockInterface service is invalid.');
                    }

                    return new ScenarioAnalyticsUseCase($query, $scenarios, $clock);
                },
            )
            ->set(
                ScenarioAnalyticsHandler::class,
                static function (ContainerInterface $c): ScenarioAnalyticsHandler {
                    $useCase = $c->get(ScenarioAnalyticsUseCase::class);
                    $json    = $c->get(JsonResponseFactory::class);

                    if (!$useCase instanceof ScenarioAnalyticsUseCase) {
                        throw new LogicException('ScenarioAnalyticsUseCase service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ScenarioAnalyticsHandler($useCase, $json);
                },
            )
            // ── Action log list handler ────────────────────────────────────────
            ->set(
                ListActionLogsHandler::class,
                static function (ContainerInterface $c): ListActionLogsHandler {
                    $repo = $c->get(ActionLogRepositoryInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$repo instanceof ActionLogRepositoryInterface) {
                        throw new LogicException('ActionLog repository service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListActionLogsHandler($repo, $json);
                },
            )
            // ── Route registrar ────────────────────────────────────────────────
            ->set(
                ActionRouteRegistrar::class,
                static function (ContainerInterface $c): ActionRouteRegistrar {
                    $list      = $c->get(ListCredentialsHandler::class);
                    $create    = $c->get(CreateCredentialHandler::class);
                    $update    = $c->get(UpdateCredentialHandler::class);
                    $delete    = $c->get(DeleteCredentialHandler::class);
                    $analytics = $c->get(ScenarioAnalyticsHandler::class);
                    $logs      = $c->get(ListActionLogsHandler::class);

                    if (!$list instanceof ListCredentialsHandler) {
                        throw new LogicException('ListCredentials handler service is invalid.');
                    }

                    if (!$create instanceof CreateCredentialHandler) {
                        throw new LogicException('CreateCredential handler service is invalid.');
                    }

                    if (!$update instanceof UpdateCredentialHandler) {
                        throw new LogicException('UpdateCredential handler service is invalid.');
                    }

                    if (!$delete instanceof DeleteCredentialHandler) {
                        throw new LogicException('DeleteCredential handler service is invalid.');
                    }

                    if (!$analytics instanceof ScenarioAnalyticsHandler) {
                        throw new LogicException('ScenarioAnalytics handler service is invalid.');
                    }

                    if (!$logs instanceof ListActionLogsHandler) {
                        throw new LogicException('ListActionLogs handler service is invalid.');
                    }

                    return new ActionRouteRegistrar($list, $create, $update, $delete, $analytics, $logs);
                },
            );
    }
}
