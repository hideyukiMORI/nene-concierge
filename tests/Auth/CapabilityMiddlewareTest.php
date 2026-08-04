<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use Nene2\Error\ProblemDetailsResponseFactory;
use NeNeConcierge\Auth\CapabilityMiddleware;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * 認可段（CapabilityMiddleware）をミドルウェアとして実走させる負テスト（#212）。
 *
 * CapabilityResolver の単体テストは「どの能力を要求するか」を pin するが、素通りが
 * 実際に起きるのは `resolve()` が null を返したときに CapabilityMiddleware が
 * ハンドラへ直行する経路（CapabilityMiddleware.php:36）である。ここでは能力を
 * 持たない主体でミドルウェアを通し、**403 で止まること**を実測する。
 */
final class CapabilityMiddlewareTest extends TestCase
{
    /** 匿名クラス（ハンドラ代役）からも参照するため public */
    public const HANDLER_REACHED = 299;

    /**
     * 有効な role クレームを持たない主体（machine token・role 欠落・未知の role）は、
     * GET だけでなく **HEAD でも** 403 で止まらなければならない。
     *
     * 修正前は HEAD が `resolve()` で null になり認可段を素通りしてハンドラへ届いていた
     * （＝ステータスコードによる存在オラクル・Content-Length による規模推定）。
     */
    #[DataProvider('readMethods')]
    public function test_principal_without_a_valid_role_is_forbidden_on_scenario_reads(string $method): void
    {
        $response = $this->dispatch($method, '/api/v1/scenarios', ['sub' => 'no-role-token']);

        self::assertSame(
            403,
            $response->getStatusCode(),
            sprintf('%s /api/v1/scenarios が認可段を素通りした（#212 の再発）', $method),
        );
    }

    #[DataProvider('readMethods')]
    public function test_scenario_revisions_are_guarded_for_both_read_methods(string $method): void
    {
        $response = $this->dispatch($method, '/api/v1/scenario-revisions', ['sub' => 'no-role-token']);

        self::assertSame(403, $response->getStatusCode());
    }

    /**
     * 逆方向の対照: ViewScenarios を持つ role は GET と同じく HEAD も通る。
     * 「HEAD を一律に閉じた」のではなく「GET と同じ扱いにした」ことの証明。
     */
    #[DataProvider('readMethods')]
    public function test_viewer_passes_scenario_reads_with_either_method(string $method): void
    {
        $response = $this->dispatch($method, '/api/v1/scenarios', ['sub' => 'viewer', 'role' => 'viewer']);

        self::assertSame(self::HANDLER_REACHED, $response->getStatusCode());
    }

    /**
     * 未認証（claims なし）は認可段の対象外で素通りする。これは仕様どおりで、
     * 認証は前段の AdminApiAuthMiddleware の責務である。
     */
    public function test_unauthenticated_requests_pass_through_to_the_auth_stage_contract(): void
    {
        $response = $this->dispatch('HEAD', '/api/v1/scenarios', null);

        self::assertSame(self::HANDLER_REACHED, $response->getStatusCode());
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function readMethods(): iterable
    {
        yield 'GET'  => ['GET'];
        yield 'HEAD' => ['HEAD'];
    }

    /**
     * @param array<string, mixed>|null $claims
     */
    private function dispatch(string $method, string $path, ?array $claims): ResponseInterface
    {
        $psr17      = new Psr17Factory();
        $middleware = new CapabilityMiddleware(new ProblemDetailsResponseFactory($psr17, $psr17));

        $request = $psr17->createServerRequest($method, $path);

        if ($claims !== null) {
            $request = $request->withAttribute('nene2.auth.claims', $claims);
        }

        return $middleware->process($request, new class ($psr17) implements RequestHandlerInterface {
            public function __construct(private readonly Psr17Factory $psr17)
            {
            }

            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return $this->psr17->createResponse(CapabilityMiddlewareTest::HANDLER_REACHED);
            }
        });
    }
}
