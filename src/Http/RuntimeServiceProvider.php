<?php

declare(strict_types=1);

namespace NeNeConcierge\Http;

use LogicException;
use Nene2\Auth\GuardedJwtSecretResolver;
use Nene2\Auth\LocalBearerTokenVerifier;
use Nene2\Auth\TokenIssuerInterface;
use Nene2\Auth\TokenVerifierInterface;
use Nene2\Config\AppConfig;
use Nene2\Config\ConfigLoader;
use Nene2\Database\DatabaseConnectionFactoryInterface;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\DatabaseTransactionManagerInterface;
use Nene2\Database\PdoConnectionFactory;
use Nene2\Database\PdoDatabaseQueryExecutor;
use Nene2\Database\PdoDatabaseTransactionManager;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Error\DomainExceptionHandlerInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\ClockInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Http\RequestScopedHolder;
use Nene2\Http\ResponseEmitter;
use Nene2\Http\RuntimeApplicationFactory;
use Nene2\Http\UtcClock;
use Nene2\Log\MonologLoggerFactory;
use Nene2\Log\RequestIdHolder;
use NeNeConcierge\ApplicationServiceProvider;
use NeNeConcierge\Auth\AdminApiAuthMiddleware;
use NeNeConcierge\Auth\CapabilityMiddleware;
use NeNeConcierge\Organization\OrganizationRepositoryInterface;
use NeNeConcierge\Organization\Resolution\EnvResolutionStrategy;
use NeNeConcierge\Organization\Resolution\OrgResolverMiddleware;
use NeNeConcierge\Organization\Resolution\PathPrefixResolutionStrategy;
use NeNeConcierge\Organization\Resolution\SubdomainResolutionStrategy;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Log\LoggerInterface;

final readonly class RuntimeServiceProvider implements ServiceProviderInterface
{
    public const PROJECT_ROOT = 'nene-concierge.project_root';

    /**
     * Development-only fallback secret, injected into
     * {@see GuardedJwtSecretResolver} as the product's development secret. It is
     * used **only** off-production, and only when the operator opts in via
     * `NENE2_ALLOW_DEV_SECRET=1` and `NENE2_LOCAL_JWT_SECRET` is unset. This
     * constant is public in the OSS repository, so signing real tokens with it
     * would be a full auth bypass — production always fails closed instead.
     */
    private const DEFAULT_DEV_SECRET = 'nene-concierge-dev-secret';

    public function register(ContainerBuilder $builder): void
    {
        $builder->addProvider(new ApplicationServiceProvider());

        $builder
            ->set(
                ConfigLoader::class,
                static function (ContainerInterface $container): ConfigLoader {
                    $projectRoot = $container->get(self::PROJECT_ROOT);

                    if (!is_string($projectRoot) || $projectRoot === '') {
                        throw new LogicException('Project root service is invalid.');
                    }

                    return new ConfigLoader($projectRoot);
                },
            )
            ->set(
                AppConfig::class,
                static function (ContainerInterface $container): AppConfig {
                    $loader = $container->get(ConfigLoader::class);

                    if (!$loader instanceof ConfigLoader) {
                        throw new LogicException('Config loader service is invalid.');
                    }

                    return $loader->load();
                },
            )
            ->set(
                DatabaseConnectionFactoryInterface::class,
                static function (ContainerInterface $container): DatabaseConnectionFactoryInterface {
                    $config = $container->get(AppConfig::class);

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    return new PdoConnectionFactory($config->database);
                },
            )
            ->set(
                DatabaseQueryExecutorInterface::class,
                static function (ContainerInterface $container): DatabaseQueryExecutorInterface {
                    $connectionFactory = $container->get(DatabaseConnectionFactoryInterface::class);

                    if (!$connectionFactory instanceof DatabaseConnectionFactoryInterface) {
                        throw new LogicException('Database connection factory service is invalid.');
                    }

                    return new PdoDatabaseQueryExecutor($connectionFactory);
                },
            )
            ->set(
                DatabaseTransactionManagerInterface::class,
                static function (ContainerInterface $container): DatabaseTransactionManagerInterface {
                    $connectionFactory = $container->get(DatabaseConnectionFactoryInterface::class);

                    if (!$connectionFactory instanceof DatabaseConnectionFactoryInterface) {
                        throw new LogicException('Database connection factory service is invalid.');
                    }

                    return new PdoDatabaseTransactionManager($connectionFactory);
                },
            )
            ->set(ClockInterface::class, static fn (ContainerInterface $container): ClockInterface => new UtcClock())
            ->set(Psr17Factory::class, static fn (ContainerInterface $container): Psr17Factory => new Psr17Factory())
            ->set(
                ResponseFactoryInterface::class,
                static function (ContainerInterface $container): ResponseFactoryInterface {
                    $factory = $container->get(Psr17Factory::class);

                    if (!$factory instanceof ResponseFactoryInterface) {
                        throw new LogicException('PSR-17 response factory service is invalid.');
                    }

                    return $factory;
                },
            )
            ->set(
                StreamFactoryInterface::class,
                static function (ContainerInterface $container): StreamFactoryInterface {
                    $factory = $container->get(Psr17Factory::class);

                    if (!$factory instanceof StreamFactoryInterface) {
                        throw new LogicException('PSR-17 stream factory service is invalid.');
                    }

                    return $factory;
                },
            )
            ->set(
                JsonResponseFactory::class,
                static function (ContainerInterface $container): JsonResponseFactory {
                    $responseFactory = $container->get(ResponseFactoryInterface::class);
                    $streamFactory   = $container->get(StreamFactoryInterface::class);

                    if (!$responseFactory instanceof ResponseFactoryInterface) {
                        throw new LogicException('Response factory service is invalid.');
                    }

                    if (!$streamFactory instanceof StreamFactoryInterface) {
                        throw new LogicException('Stream factory service is invalid.');
                    }

                    return new JsonResponseFactory($responseFactory, $streamFactory);
                },
            )
            ->set(
                ProblemDetailsResponseFactory::class,
                static function (ContainerInterface $container): ProblemDetailsResponseFactory {
                    $responseFactory = $container->get(ResponseFactoryInterface::class);
                    $streamFactory   = $container->get(StreamFactoryInterface::class);
                    $config          = $container->get(AppConfig::class);

                    if (!$responseFactory instanceof ResponseFactoryInterface) {
                        throw new LogicException('Response factory service is invalid.');
                    }

                    if (!$streamFactory instanceof StreamFactoryInterface) {
                        throw new LogicException('Stream factory service is invalid.');
                    }

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    return new ProblemDetailsResponseFactory(
                        $responseFactory,
                        $streamFactory,
                        $config->problemDetailsBaseUrl,
                    );
                },
            )
            ->set(RequestIdHolder::class, static fn (ContainerInterface $container): RequestIdHolder => new RequestIdHolder())
            ->set(
                LocalBearerTokenVerifier::class,
                static function (ContainerInterface $container): LocalBearerTokenVerifier {
                    $config = $container->get(AppConfig::class);

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    return new LocalBearerTokenVerifier(
                        GuardedJwtSecretResolver::fromConfig($config, self::DEFAULT_DEV_SECRET),
                    );
                },
            )
            ->set(
                TokenVerifierInterface::class,
                static function (ContainerInterface $container): TokenVerifierInterface {
                    $verifier = $container->get(LocalBearerTokenVerifier::class);

                    if (!$verifier instanceof TokenVerifierInterface) {
                        throw new LogicException('LocalBearerTokenVerifier service is invalid.');
                    }

                    return $verifier;
                },
            )
            ->set(
                TokenIssuerInterface::class,
                static function (ContainerInterface $container): TokenIssuerInterface {
                    $issuer = $container->get(LocalBearerTokenVerifier::class);

                    if (!$issuer instanceof TokenIssuerInterface) {
                        throw new LogicException('LocalBearerTokenVerifier service is invalid.');
                    }

                    return $issuer;
                },
            )
            ->set(
                'nene-concierge.token_issuer',
                static function (ContainerInterface $container): TokenIssuerInterface {
                    return $container->get(TokenIssuerInterface::class);
                },
            )
            ->set(
                LoggerInterface::class,
                static function (ContainerInterface $container): LoggerInterface {
                    $config = $container->get(AppConfig::class);
                    $debug  = $config instanceof AppConfig && $config->debug;
                    $holder = $container->get(RequestIdHolder::class);

                    return (new MonologLoggerFactory())->create(
                        'nene-concierge',
                        $debug,
                        $holder instanceof RequestIdHolder ? $holder : null,
                    );
                },
            )
            ->set(
                RuntimeApplicationFactory::class,
                static function (ContainerInterface $container): RuntimeApplicationFactory {
                    $responseFactory   = $container->get(ResponseFactoryInterface::class);
                    $streamFactory     = $container->get(StreamFactoryInterface::class);
                    $logger            = $container->get(LoggerInterface::class);
                    $config            = $container->get(AppConfig::class);
                    $exceptionHandlers = $container->get(ApplicationServiceProvider::EXCEPTION_HANDLERS);
                    $routeRegistrars   = $container->get(ApplicationServiceProvider::ROUTE_REGISTRARS);
                    $requestIdHolder   = $container->get(RequestIdHolder::class);

                    if (!$responseFactory instanceof ResponseFactoryInterface) {
                        throw new LogicException('Response factory service is invalid.');
                    }

                    if (!$streamFactory instanceof StreamFactoryInterface) {
                        throw new LogicException('Stream factory service is invalid.');
                    }

                    if (!$logger instanceof LoggerInterface) {
                        throw new LogicException('Logger service is invalid.');
                    }

                    if (!$config instanceof AppConfig) {
                        throw new LogicException('Application config service is invalid.');
                    }

                    if (!is_array($exceptionHandlers) || !array_is_list($exceptionHandlers)) {
                        throw new LogicException('Exception handlers service is invalid.');
                    }

                    if (!is_array($routeRegistrars) || !array_is_list($routeRegistrars)) {
                        throw new LogicException('Route registrars service is invalid.');
                    }

                    /** @var list<DomainExceptionHandlerInterface> $exceptionHandlers */
                    /** @var list<callable(\Nene2\Routing\Router): void> $routeRegistrars */

                    if (!$requestIdHolder instanceof RequestIdHolder) {
                        throw new LogicException('RequestIdHolder service is invalid.');
                    }

                    // Resolve tenant resolution mode from env
                    $resolvedMode   = (string) (getenv('TENANT_RESOLUTION') ?: 'single');
                    $resolvedSlug   = (string) (getenv('ORG_SLUG') ?: '');
                    $resolvedDomain = (string) (getenv('BASE_DOMAIN') ?: 'localhost');

                    // CORS allowlist: comma-separated exact origins from env. The
                    // framework default (empty list) fails closed — no CORS
                    // headers are emitted. Production installs that serve the
                    // admin SPA or embed widget from another origin MUST set
                    // NENE_CONCIERGE_ALLOWED_ORIGINS explicitly. Wildcard '*' is
                    // rejected by CorsMiddleware, so it is filtered out here.
                    $allowedOrigins = array_values(array_filter(
                        array_map('trim', explode(',', (string) (getenv('NENE_CONCIERGE_ALLOWED_ORIGINS') ?: ''))),
                        static fn (string $origin): bool => $origin !== '' && $origin !== '*',
                    ));

                    // HSTS: opt-in via env, off by default. Enable only when the
                    // app is served over HTTPS (directly or behind a
                    // TLS-terminating proxy).
                    $enableHsts = in_array(
                        strtolower((string) (getenv('NENE_CONCIERGE_ENABLE_HSTS') ?: '')),
                        ['1', 'true', 'yes', 'on'],
                        true,
                    );

                    $orgRepo = $container->get(OrganizationRepositoryInterface::class);
                    if (!$orgRepo instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('OrganizationRepositoryInterface service is invalid.');
                    }

                    $orgIdHolder = $container->get(ApplicationServiceProvider::ORG_ID_HOLDER);
                    if (!$orgIdHolder instanceof RequestScopedHolder) {
                        throw new LogicException('Org ID holder service is invalid.');
                    }
                    /** @var RequestScopedHolder<int> $orgIdHolder */

                    $problemDetails = $container->get(ProblemDetailsResponseFactory::class);
                    $tokenVerifier  = $container->get(TokenVerifierInterface::class);

                    if (!$problemDetails instanceof ProblemDetailsResponseFactory) {
                        throw new LogicException('ProblemDetailsResponseFactory service is invalid.');
                    }

                    if (!$tokenVerifier instanceof TokenVerifierInterface) {
                        throw new LogicException('TokenVerifierInterface service is invalid.');
                    }

                    $strategy = match ($resolvedMode) {
                        'subdomain' => new SubdomainResolutionStrategy($resolvedDomain),
                        'path'      => new PathPrefixResolutionStrategy(),
                        default     => new EnvResolutionStrategy($resolvedSlug),
                    };

                    $authMiddleware = [
                        new OrgResolverMiddleware($orgIdHolder, $orgRepo, $problemDetails, $strategy),
                        new AdminApiAuthMiddleware($problemDetails, $tokenVerifier),
                        new CapabilityMiddleware($problemDetails),
                    ];

                    return new RuntimeApplicationFactory(
                        responseFactory: $responseFactory,
                        streamFactory: $streamFactory,
                        logger: $logger,
                        machineApiKey: $config->machineApiKey,
                        domainExceptionHandlers: $exceptionHandlers,
                        requestIdHolder: $requestIdHolder,
                        routeRegistrars: $routeRegistrars,
                        authMiddleware: $authMiddleware,
                        debug: $config->debug,
                        allowedOrigins: $allowedOrigins,
                        enableHsts: $enableHsts,
                        // Opt-in の X-Authorization フォールバック受け口（NENE2 #1558・ADR 0019）。
                        // 前段 proxy が標準 Authorization を剥がす共有ホスティング（HETEML 型 Tier A）で、
                        // @hideyukimori/nene2-client v1.1.0（admin SPA が採用済み・#164）が全リクエストに
                        // 付与する `X-Authorization: Bearer` ミラーを Authorization 不在/空のときのみ採用
                        // する。標準ヘッダが届く環境ではバイト不変。
                        enableAuthorizationHeaderFallback: true,
                    );
                },
            )
            ->set(
                RequestHandlerInterface::class,
                static function (ContainerInterface $container): RequestHandlerInterface {
                    $factory = $container->get(RuntimeApplicationFactory::class);

                    if (!$factory instanceof RuntimeApplicationFactory) {
                        throw new LogicException('Runtime application factory service is invalid.');
                    }

                    return $factory->create();
                },
            )
            ->set(ResponseEmitter::class, static fn (ContainerInterface $container): ResponseEmitter => new ResponseEmitter());
    }
}
