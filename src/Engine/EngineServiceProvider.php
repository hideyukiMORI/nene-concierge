<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use NeNeConcierge\Action\ActionDispatcher;
use NeNeConcierge\Scenario\ScenarioEdgeRepositoryInterface;
use NeNeConcierge\Scenario\ScenarioNodeRepositoryInterface;
use NeNeConcierge\Scenario\ScenarioRepositoryInterface;
use NeNeConcierge\Session\ChatSessionRepositoryInterface;
use NeNeConcierge\Session\GetSessionDetailHandler;
use NeNeConcierge\Session\ListSessionsHandler;
use NeNeConcierge\Session\PdoChatSessionRepository;
use NeNeConcierge\Session\PdoSessionMessageRepository;
use NeNeConcierge\Session\PdoSessionNodeEventRepository;
use NeNeConcierge\Session\SessionMessageRepositoryInterface;
use NeNeConcierge\Session\SessionNodeEventRepositoryInterface;
use Psr\Container\ContainerInterface;

final readonly class EngineServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            // ── Session repositories ───────────────────────────────────────────
            ->set(
                ChatSessionRepositoryInterface::class,
                static function (ContainerInterface $c): ChatSessionRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoChatSessionRepository($query);
                },
            )
            ->set(
                SessionNodeEventRepositoryInterface::class,
                static function (ContainerInterface $c): SessionNodeEventRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoSessionNodeEventRepository($query);
                },
            )
            ->set(
                SessionMessageRepositoryInterface::class,
                static function (ContainerInterface $c): SessionMessageRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoSessionMessageRepository($query);
                },
            )
            // ── Engine utilities ───────────────────────────────────────────────
            ->set(
                ConditionEvaluator::class,
                static fn (): ConditionEvaluator => new ConditionEvaluator(),
            )
            ->set(
                VariableInterpolator::class,
                static fn (): VariableInterpolator => new VariableInterpolator(),
            )
            // ── Engine ─────────────────────────────────────────────────────────
            ->set(
                ScenarioEngine::class,
                static function (ContainerInterface $c): ScenarioEngine {
                    $scenarios        = $c->get(ScenarioRepositoryInterface::class);
                    $nodes            = $c->get(ScenarioNodeRepositoryInterface::class);
                    $edges            = $c->get(ScenarioEdgeRepositoryInterface::class);
                    $sessions         = $c->get(ChatSessionRepositoryInterface::class);
                    $events           = $c->get(SessionNodeEventRepositoryInterface::class);
                    $conditions       = $c->get(ConditionEvaluator::class);
                    $interpolator     = $c->get(VariableInterpolator::class);
                    $actionDispatcher = $c->get(ActionDispatcher::class);
                    $clock            = $c->get(ClockInterface::class);

                    if (!$scenarios instanceof ScenarioRepositoryInterface) {
                        throw new LogicException('Scenario repository service is invalid.');
                    }

                    if (!$nodes instanceof ScenarioNodeRepositoryInterface) {
                        throw new LogicException('Scenario node repository service is invalid.');
                    }

                    if (!$edges instanceof ScenarioEdgeRepositoryInterface) {
                        throw new LogicException('Scenario edge repository service is invalid.');
                    }

                    if (!$sessions instanceof ChatSessionRepositoryInterface) {
                        throw new LogicException('Chat session repository service is invalid.');
                    }

                    if (!$events instanceof SessionNodeEventRepositoryInterface) {
                        throw new LogicException('Session node event repository service is invalid.');
                    }

                    if (!$conditions instanceof ConditionEvaluator) {
                        throw new LogicException('ConditionEvaluator service is invalid.');
                    }

                    if (!$interpolator instanceof VariableInterpolator) {
                        throw new LogicException('VariableInterpolator service is invalid.');
                    }

                    if (!$actionDispatcher instanceof ActionDispatcher) {
                        throw new LogicException('ActionDispatcher service is invalid.');
                    }

                    if (!$clock instanceof ClockInterface) {
                        throw new LogicException('ClockInterface service is invalid.');
                    }

                    return new ScenarioEngine($scenarios, $nodes, $edges, $sessions, $events, $conditions, $interpolator, $actionDispatcher, $clock);
                },
            )
            // ── Handlers ───────────────────────────────────────────────────────
            ->set(
                StartSessionHandler::class,
                static function (ContainerInterface $c): StartSessionHandler {
                    $engine = $c->get(ScenarioEngine::class);
                    $json   = $c->get(JsonResponseFactory::class);

                    if (!$engine instanceof ScenarioEngine) {
                        throw new LogicException('ScenarioEngine service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new StartSessionHandler($engine, $json);
                },
            )
            ->set(
                StepSessionHandler::class,
                static function (ContainerInterface $c): StepSessionHandler {
                    $engine = $c->get(ScenarioEngine::class);
                    $json   = $c->get(JsonResponseFactory::class);

                    if (!$engine instanceof ScenarioEngine) {
                        throw new LogicException('ScenarioEngine service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new StepSessionHandler($engine, $json);
                },
            )
            ->set(
                PreviewStartHandler::class,
                static function (ContainerInterface $c): PreviewStartHandler {
                    $engine = $c->get(ScenarioEngine::class);
                    $json   = $c->get(JsonResponseFactory::class);

                    if (!$engine instanceof ScenarioEngine) {
                        throw new LogicException('ScenarioEngine service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new PreviewStartHandler($engine, $json);
                },
            )
            ->set(
                PreviewStepHandler::class,
                static function (ContainerInterface $c): PreviewStepHandler {
                    $engine = $c->get(ScenarioEngine::class);
                    $json   = $c->get(JsonResponseFactory::class);

                    if (!$engine instanceof ScenarioEngine) {
                        throw new LogicException('ScenarioEngine service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new PreviewStepHandler($engine, $json);
                },
            )
            // ── Admin session handlers ─────────────────────────────────────────
            ->set(
                ListSessionsHandler::class,
                static function (ContainerInterface $c): ListSessionsHandler {
                    $sessions = $c->get(ChatSessionRepositoryInterface::class);
                    $json     = $c->get(JsonResponseFactory::class);

                    if (!$sessions instanceof ChatSessionRepositoryInterface) {
                        throw new LogicException('ChatSession repository service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListSessionsHandler($sessions, $json);
                },
            )
            ->set(
                GetSessionDetailHandler::class,
                static function (ContainerInterface $c): GetSessionDetailHandler {
                    $sessions  = $c->get(ChatSessionRepositoryInterface::class);
                    $messages  = $c->get(SessionMessageRepositoryInterface::class);
                    $json      = $c->get(JsonResponseFactory::class);
                    $problem   = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$sessions instanceof ChatSessionRepositoryInterface) {
                        throw new LogicException('ChatSession repository service is invalid.');
                    }

                    if (!$messages instanceof SessionMessageRepositoryInterface) {
                        throw new LogicException('SessionMessage repository service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    if (!$problem instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('ProblemDetails response factory service is invalid.');
                    }

                    return new GetSessionDetailHandler($sessions, $messages, $json, $problem);
                },
            )
            // ── Exception handler ──────────────────────────────────────────────
            ->set(
                EngineExceptionHandler::class,
                static function (ContainerInterface $c): EngineExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new EngineExceptionHandler($problemDetails);
                },
            )
            // ── Route registrar ────────────────────────────────────────────────
            ->set(
                EngineRouteRegistrar::class,
                static function (ContainerInterface $c): EngineRouteRegistrar {
                    $start            = $c->get(StartSessionHandler::class);
                    $step             = $c->get(StepSessionHandler::class);
                    $previewStart     = $c->get(PreviewStartHandler::class);
                    $previewStep      = $c->get(PreviewStepHandler::class);
                    $listSessions     = $c->get(ListSessionsHandler::class);
                    $getSessionDetail = $c->get(GetSessionDetailHandler::class);

                    if (!$start instanceof StartSessionHandler) {
                        throw new LogicException('StartSession handler service is invalid.');
                    }

                    if (!$step instanceof StepSessionHandler) {
                        throw new LogicException('StepSession handler service is invalid.');
                    }

                    if (!$previewStart instanceof PreviewStartHandler) {
                        throw new LogicException('PreviewStart handler service is invalid.');
                    }

                    if (!$previewStep instanceof PreviewStepHandler) {
                        throw new LogicException('PreviewStep handler service is invalid.');
                    }

                    if (!$listSessions instanceof ListSessionsHandler) {
                        throw new LogicException('ListSessions handler service is invalid.');
                    }

                    if (!$getSessionDetail instanceof GetSessionDetailHandler) {
                        throw new LogicException('GetSessionDetail handler service is invalid.');
                    }

                    return new EngineRouteRegistrar($start, $step, $previewStart, $previewStep, $listSessions, $getSessionDetail);
                },
            );
    }
}
