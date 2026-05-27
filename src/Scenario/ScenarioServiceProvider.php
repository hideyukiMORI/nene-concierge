<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\DatabaseTransactionManagerInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class ScenarioServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            // ── Repositories ───────────────────────────────────────────────────
            ->set(
                ScenarioRepositoryInterface::class,
                static function (ContainerInterface $c): ScenarioRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoScenarioRepository($query);
                },
            )
            ->set(
                ScenarioNodeRepositoryInterface::class,
                static function (ContainerInterface $c): ScenarioNodeRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $tx    = $c->get(DatabaseTransactionManagerInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$tx instanceof DatabaseTransactionManagerInterface) {
                        throw new LogicException('Database transaction manager service is invalid.');
                    }

                    return new PdoScenarioNodeRepository($query, $tx);
                },
            )
            ->set(
                ScenarioEdgeRepositoryInterface::class,
                static function (ContainerInterface $c): ScenarioEdgeRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);
                    $tx    = $c->get(DatabaseTransactionManagerInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    if (!$tx instanceof DatabaseTransactionManagerInterface) {
                        throw new LogicException('Database transaction manager service is invalid.');
                    }

                    return new PdoScenarioEdgeRepository($query, $tx);
                },
            )
            // ── Use cases ──────────────────────────────────────────────────────
            ->set(
                ListScenariosUseCase::class,
                static function (ContainerInterface $c): ListScenariosUseCase {
                    $repo = $c->get(ScenarioRepositoryInterface::class);

                    if (!$repo instanceof ScenarioRepositoryInterface) {
                        throw new LogicException('Scenario repository service is invalid.');
                    }

                    return new ListScenariosUseCase($repo);
                },
            )
            ->set(
                GetScenarioUseCase::class,
                static function (ContainerInterface $c): GetScenarioUseCase {
                    $scenarios = $c->get(ScenarioRepositoryInterface::class);
                    $nodes     = $c->get(ScenarioNodeRepositoryInterface::class);
                    $edges     = $c->get(ScenarioEdgeRepositoryInterface::class);

                    if (!$scenarios instanceof ScenarioRepositoryInterface) {
                        throw new LogicException('Scenario repository service is invalid.');
                    }

                    if (!$nodes instanceof ScenarioNodeRepositoryInterface) {
                        throw new LogicException('Scenario node repository service is invalid.');
                    }

                    if (!$edges instanceof ScenarioEdgeRepositoryInterface) {
                        throw new LogicException('Scenario edge repository service is invalid.');
                    }

                    return new GetScenarioUseCase($scenarios, $nodes, $edges);
                },
            )
            ->set(
                CreateScenarioUseCase::class,
                static function (ContainerInterface $c): CreateScenarioUseCase {
                    $scenarios = $c->get(ScenarioRepositoryInterface::class);
                    $nodes     = $c->get(ScenarioNodeRepositoryInterface::class);
                    $edges     = $c->get(ScenarioEdgeRepositoryInterface::class);

                    if (!$scenarios instanceof ScenarioRepositoryInterface) {
                        throw new LogicException('Scenario repository service is invalid.');
                    }

                    if (!$nodes instanceof ScenarioNodeRepositoryInterface) {
                        throw new LogicException('Scenario node repository service is invalid.');
                    }

                    if (!$edges instanceof ScenarioEdgeRepositoryInterface) {
                        throw new LogicException('Scenario edge repository service is invalid.');
                    }

                    return new CreateScenarioUseCase($scenarios, $nodes, $edges);
                },
            )
            ->set(
                UpdateScenarioUseCase::class,
                static function (ContainerInterface $c): UpdateScenarioUseCase {
                    $scenarios = $c->get(ScenarioRepositoryInterface::class);
                    $nodes     = $c->get(ScenarioNodeRepositoryInterface::class);
                    $edges     = $c->get(ScenarioEdgeRepositoryInterface::class);

                    if (!$scenarios instanceof ScenarioRepositoryInterface) {
                        throw new LogicException('Scenario repository service is invalid.');
                    }

                    if (!$nodes instanceof ScenarioNodeRepositoryInterface) {
                        throw new LogicException('Scenario node repository service is invalid.');
                    }

                    if (!$edges instanceof ScenarioEdgeRepositoryInterface) {
                        throw new LogicException('Scenario edge repository service is invalid.');
                    }

                    return new UpdateScenarioUseCase($scenarios, $nodes, $edges);
                },
            )
            ->set(
                DeleteScenarioUseCase::class,
                static function (ContainerInterface $c): DeleteScenarioUseCase {
                    $repo = $c->get(ScenarioRepositoryInterface::class);

                    if (!$repo instanceof ScenarioRepositoryInterface) {
                        throw new LogicException('Scenario repository service is invalid.');
                    }

                    return new DeleteScenarioUseCase($repo);
                },
            )
            ->set(
                ExportScenarioUseCase::class,
                static function (ContainerInterface $c): ExportScenarioUseCase {
                    $scenarios = $c->get(ScenarioRepositoryInterface::class);
                    $nodes     = $c->get(ScenarioNodeRepositoryInterface::class);
                    $edges     = $c->get(ScenarioEdgeRepositoryInterface::class);

                    if (!$scenarios instanceof ScenarioRepositoryInterface) {
                        throw new LogicException('Scenario repository service is invalid.');
                    }

                    if (!$nodes instanceof ScenarioNodeRepositoryInterface) {
                        throw new LogicException('Scenario node repository service is invalid.');
                    }

                    if (!$edges instanceof ScenarioEdgeRepositoryInterface) {
                        throw new LogicException('Scenario edge repository service is invalid.');
                    }

                    return new ExportScenarioUseCase($scenarios, $nodes, $edges);
                },
            )
            ->set(
                ImportScenarioUseCase::class,
                static function (ContainerInterface $c): ImportScenarioUseCase {
                    $scenarios = $c->get(ScenarioRepositoryInterface::class);
                    $nodes     = $c->get(ScenarioNodeRepositoryInterface::class);
                    $edges     = $c->get(ScenarioEdgeRepositoryInterface::class);

                    if (!$scenarios instanceof ScenarioRepositoryInterface) {
                        throw new LogicException('Scenario repository service is invalid.');
                    }

                    if (!$nodes instanceof ScenarioNodeRepositoryInterface) {
                        throw new LogicException('Scenario node repository service is invalid.');
                    }

                    if (!$edges instanceof ScenarioEdgeRepositoryInterface) {
                        throw new LogicException('Scenario edge repository service is invalid.');
                    }

                    return new ImportScenarioUseCase($scenarios, $nodes, $edges);
                },
            )
            // ── Handlers ───────────────────────────────────────────────────────
            ->set(
                ListScenariosHandler::class,
                static function (ContainerInterface $c): ListScenariosHandler {
                    $uc   = $c->get(ListScenariosUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ListScenariosUseCase) {
                        throw new LogicException('ListScenarios use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ListScenariosHandler($uc, $json);
                },
            )
            ->set(
                GetScenarioHandler::class,
                static function (ContainerInterface $c): GetScenarioHandler {
                    $uc   = $c->get(GetScenarioUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetScenarioUseCase) {
                        throw new LogicException('GetScenario use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetScenarioHandler($uc, $json);
                },
            )
            ->set(
                CreateScenarioHandler::class,
                static function (ContainerInterface $c): CreateScenarioHandler {
                    $uc   = $c->get(CreateScenarioUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof CreateScenarioUseCase) {
                        throw new LogicException('CreateScenario use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new CreateScenarioHandler($uc, $json);
                },
            )
            ->set(
                UpdateScenarioHandler::class,
                static function (ContainerInterface $c): UpdateScenarioHandler {
                    $uc   = $c->get(UpdateScenarioUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof UpdateScenarioUseCase) {
                        throw new LogicException('UpdateScenario use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new UpdateScenarioHandler($uc, $json);
                },
            )
            ->set(
                DeleteScenarioHandler::class,
                static function (ContainerInterface $c): DeleteScenarioHandler {
                    $uc   = $c->get(DeleteScenarioUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof DeleteScenarioUseCase) {
                        throw new LogicException('DeleteScenario use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new DeleteScenarioHandler($uc, $json);
                },
            )
            ->set(
                ExportScenarioHandler::class,
                static function (ContainerInterface $c): ExportScenarioHandler {
                    $uc   = $c->get(ExportScenarioUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ExportScenarioUseCase) {
                        throw new LogicException('ExportScenario use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ExportScenarioHandler($uc, $json);
                },
            )
            ->set(
                ImportScenarioHandler::class,
                static function (ContainerInterface $c): ImportScenarioHandler {
                    $uc   = $c->get(ImportScenarioUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof ImportScenarioUseCase) {
                        throw new LogicException('ImportScenario use case service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new ImportScenarioHandler($uc, $json);
                },
            )
            // ── Exception handler ──────────────────────────────────────────────
            ->set(
                ScenarioNotFoundExceptionHandler::class,
                static function (ContainerInterface $c): ScenarioNotFoundExceptionHandler {
                    $problemDetails = $c->get(ProblemDetailsResponseFactory::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('Problem details response factory service is invalid.');
                    }

                    return new ScenarioNotFoundExceptionHandler($problemDetails);
                },
            )
            // ── Route registrar ────────────────────────────────────────────────
            ->set(
                ScenarioRouteRegistrar::class,
                static function (ContainerInterface $c): ScenarioRouteRegistrar {
                    $list   = $c->get(ListScenariosHandler::class);
                    $get    = $c->get(GetScenarioHandler::class);
                    $create = $c->get(CreateScenarioHandler::class);
                    $update = $c->get(UpdateScenarioHandler::class);
                    $delete = $c->get(DeleteScenarioHandler::class);
                    $export = $c->get(ExportScenarioHandler::class);
                    $import = $c->get(ImportScenarioHandler::class);

                    if (!$list instanceof ListScenariosHandler) {
                        throw new LogicException('ListScenarios handler service is invalid.');
                    }

                    if (!$get instanceof GetScenarioHandler) {
                        throw new LogicException('GetScenario handler service is invalid.');
                    }

                    if (!$create instanceof CreateScenarioHandler) {
                        throw new LogicException('CreateScenario handler service is invalid.');
                    }

                    if (!$update instanceof UpdateScenarioHandler) {
                        throw new LogicException('UpdateScenario handler service is invalid.');
                    }

                    if (!$delete instanceof DeleteScenarioHandler) {
                        throw new LogicException('DeleteScenario handler service is invalid.');
                    }

                    if (!$export instanceof ExportScenarioHandler) {
                        throw new LogicException('ExportScenario handler service is invalid.');
                    }

                    if (!$import instanceof ImportScenarioHandler) {
                        throw new LogicException('ImportScenario handler service is invalid.');
                    }

                    return new ScenarioRouteRegistrar($list, $get, $create, $update, $delete, $export, $import);
                },
            );
    }
}
