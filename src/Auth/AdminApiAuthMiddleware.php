<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use Nene2\Auth\TokenVerificationException;
use Nene2\Auth\TokenVerifierInterface;
use Nene2\Error\ProblemDetailsResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * API authentication middleware — fail-close by default.
 *
 * Protection rules (first match wins):
 *  1. Explicitly open: /health, /api/v1/auth/*, /api/v1/public/* — **the only anonymous surface**
 *  2. Every other /api/v1/ path: authenticated, for **every** HTTP method
 *  3. Everything else: open (static assets, the widget bundle)
 *
 * 🔴 The authentication decision must NOT depend on the HTTP method (#215).
 * Until 2026-08-04 rule 2 read `return $method !== 'GET' && $method !== 'HEAD' && …`, so the
 * admin API's reads were anonymous while its writes were not. What a read protects (visitor
 * conversation logs, scenario definitions, aggregates) is the same class of information a write
 * protects, so there is no basis for splitting the two. Adding a new admin route now defaults
 * to *closed*: opening it requires adding a prefix to ALWAYS_OPEN_PREFIXES, deliberately.
 */
final readonly class AdminApiAuthMiddleware implements MiddlewareInterface
{
    /**
     * The complete anonymous surface. Anything under /api/v1/ that is not matched here is
     * authenticated.
     *
     * - /health .......... liveness probe, no tenant data
     * - /api/v1/auth/ .... login itself; a credential cannot require a credential
     * - /api/v1/public/ .. the visitor-facing widget endpoints (W2a authorized divergence:
     *                      the widget uses an anonymous transport by design)
     *
     * @var list<string>
     */
    private const ALWAYS_OPEN_PREFIXES = [
        '/health',
        '/api/v1/auth/',
        '/api/v1/public/',
    ];

    public function __construct(
        private ProblemDetailsResponseFactory $problemDetails,
        private TokenVerifierInterface $verifier,
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if (!$this->requiresAuthentication($request)) {
            return $handler->handle($request);
        }

        $authorization = $request->getHeaderLine('Authorization');

        if ($authorization === '') {
            return $this->unauthorized($request, 'missing_token', 'No Bearer token was provided.');
        }

        if (!str_starts_with($authorization, 'Bearer ')) {
            return $this->unauthorized($request, 'invalid_token', 'Authorization header must use the Bearer scheme.');
        }

        $token = substr($authorization, 7);

        try {
            $claims = $this->verifier->verify($token);
        } catch (TokenVerificationException $e) {
            return $this->unauthorized($request, 'invalid_token', $e->getMessage());
        }

        return $handler->handle(
            $request
                ->withAttribute('nene2.auth.credential_type', 'bearer')
                ->withAttribute('nene2.auth.claims', $claims),
        );
    }

    private function requiresAuthentication(ServerRequestInterface $request): bool
    {
        $path = $request->getUri()->getPath() ?: '/';

        // 1. The explicit anonymous surface
        foreach (self::ALWAYS_OPEN_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return false;
            }
        }

        // 2. Every other API path is authenticated, whatever the method (#215)
        if (str_starts_with($path, '/api/v1/')) {
            return true;
        }

        // 3. Everything else: open (static assets, the widget bundle)
        return false;
    }

    private function unauthorized(ServerRequestInterface $request, string $error, string $description): ResponseInterface
    {
        return $this->problemDetails
            ->create($request, 'unauthorized', 'Unauthorized', 401, $description)
            ->withHeader(
                'WWW-Authenticate',
                sprintf(
                    'Bearer realm="NeNe Concierge", error="%s", error_description="%s"',
                    $error,
                    $this->sanitizeHeaderParam($description),
                ),
            );
    }

    private function sanitizeHeaderParam(string $value): string
    {
        return str_replace('"', '\\"', preg_replace('/\r?\n|\r/', ' ', $value) ?? $value);
    }
}
