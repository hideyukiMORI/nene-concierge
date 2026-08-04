<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use Nene2\Auth\TokenVerificationException;
use Nene2\Auth\TokenVerifierInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use NeNeConcierge\Auth\AdminApiAuthMiddleware;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * 認証段が **fail-close** であることを pin するテスト（#215）。
 *
 * 修正前は認証要否を HTTP メソッドで分岐しており、明示的に開いたプレフィックス以外でも
 * 読み取り系は無認証で通っていた。ここでは「開いているのは明示リストだけ」「それ以外の
 * /api/v1 はメソッドに関わらず閉じている」「新しい経路を足すと既定で閉じる」を固定する。
 */
final class AdminApiAuthMiddlewareTest extends TestCase
{
    public const HANDLER_REACHED = 299;

    /** 匿名クラス（トークン検証の代役）からも参照するため public */
    public const VALID_TOKEN_FOR_STUB = 'valid-token';

    /**
     * 匿名で正当な経路（widget の公開エンドポイント・ログイン・ヘルスチェック）は
     * トークン無しで通る。これが**唯一の匿名面**である。
     */
    #[DataProvider('anonymousSurface')]
    public function test_the_explicit_anonymous_surface_stays_open(string $method, string $path): void
    {
        $response = $this->dispatch($method, $path, token: null);

        self::assertSame(
            self::HANDLER_REACHED,
            $response->getStatusCode(),
            sprintf('匿名で正当な経路が閉じてしまった: %s %s', $method, $path),
        );
    }

    /**
     * 管理 API はメソッドに関わらずトークンを要求する。
     *
     * 🔴 このテストが落ちたら「読み取りだけ開いている」状態に戻っている（#215 の再発）。
     */
    #[DataProvider('protectedApiRequests')]
    public function test_admin_api_requires_a_token_for_every_method(string $method, string $path): void
    {
        $response = $this->dispatch($method, $path, token: null);

        self::assertSame(
            401,
            $response->getStatusCode(),
            sprintf('%s %s が無認証で通過した', $method, $path),
        );
        self::assertStringContainsString('Bearer', $response->getHeaderLine('WWW-Authenticate'));
    }

    /**
     * 既定で閉じることの証明。**まだ存在しない経路**を叩いても 401 になる＝新しい管理 API を
     * 足したとき、開ける手続き（ALWAYS_OPEN_PREFIXES への追記）を踏まない限り閉じている。
     */
    #[DataProvider('readMethods')]
    public function test_a_route_that_does_not_exist_yet_defaults_to_closed(string $method): void
    {
        $response = $this->dispatch($method, '/api/v1/some-future-admin-resource', token: null);

        self::assertSame(401, $response->getStatusCode(), '新しい /api/v1 経路が既定で開いている');
    }

    /**
     * 壊さないことの証明: 有効なトークンを付ければ、読み取りも書き込みもハンドラへ届く。
     * 管理 SPA は全リクエストを Bearer 付き transport で発行しているため、この経路を通る。
     */
    #[DataProvider('protectedApiRequests')]
    public function test_a_valid_token_passes_the_auth_stage(string $method, string $path): void
    {
        $response = $this->dispatch($method, $path, token: self::VALID_TOKEN_FOR_STUB);

        self::assertSame(self::HANDLER_REACHED, $response->getStatusCode());
    }

    /**
     * API 以外（静的アセット・widget バンドル）は従来どおり開いている。
     */
    public function test_non_api_paths_remain_open(): void
    {
        self::assertSame(self::HANDLER_REACHED, $this->dispatch('GET', '/widget.js', token: null)->getStatusCode());
        self::assertSame(self::HANDLER_REACHED, $this->dispatch('GET', '/admin/index.html', token: null)->getStatusCode());
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function anonymousSurface(): iterable
    {
        yield 'health'                => ['GET', '/health'];
        yield 'login'                 => ['POST', '/api/v1/auth/login'];
        yield 'public appearance'     => ['GET', '/api/v1/public/appearance'];
        yield 'public session start'  => ['POST', '/api/v1/public/sessions'];
        yield 'public session step'   => ['POST', '/api/v1/public/sessions/abc/step'];
    }

    /**
     * 管理 API × メソッドの総当たり。GET / HEAD を必ず含めること（#212 / #215 の再発点）。
     *
     * @return iterable<string, array{string, string}>
     */
    public static function protectedApiRequests(): iterable
    {
        $paths = [
            'scenarios'          => '/api/v1/scenarios',
            'scenario by id'     => '/api/v1/scenarios/1',
            'scenario revisions' => '/api/v1/scenario-revisions',
            'sessions'           => '/api/v1/sessions',
            'action logs'        => '/api/v1/action-logs',
            'action credentials' => '/api/v1/action-credentials',
            'appearance'         => '/api/v1/appearance',
            'dashboard'          => '/api/v1/dashboard',
            'users'              => '/api/v1/users',
            'organizations'      => '/api/v1/organizations',
            'me'                 => '/api/v1/me',
        ];

        foreach ($paths as $label => $path) {
            foreach (['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'] as $method) {
                yield sprintf('%s %s', $method, $label) => [$method, $path];
            }
        }
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function readMethods(): iterable
    {
        yield 'GET'  => ['GET'];
        yield 'HEAD' => ['HEAD'];
    }

    private function dispatch(string $method, string $path, ?string $token): ResponseInterface
    {
        $psr17 = new Psr17Factory();

        $verifier = new class () implements TokenVerifierInterface {
            /** @return array<string, mixed> */
            public function verify(string $token): array
            {
                if ($token !== AdminApiAuthMiddlewareTest::VALID_TOKEN_FOR_STUB) {
                    throw new TokenVerificationException('invalid token');
                }

                return ['sub' => 'operator', 'role' => 'owner'];
            }
        };

        $middleware = new AdminApiAuthMiddleware(new ProblemDetailsResponseFactory($psr17, $psr17), $verifier);

        $request = $psr17->createServerRequest($method, $path);

        if ($token !== null) {
            $request = $request->withHeader('Authorization', 'Bearer ' . $token);
        }

        return $middleware->process($request, new class ($psr17) implements RequestHandlerInterface {
            public function __construct(private readonly Psr17Factory $psr17)
            {
            }

            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return $this->psr17->createResponse(AdminApiAuthMiddlewareTest::HANDLER_REACHED);
            }
        });
    }
}
