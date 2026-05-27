<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/public/appearance
 *
 * Returns the widget appearance settings for the resolved organization.
 * No authentication required — intended for use by the embed widget (widget.js)
 * to load styling and behaviour configuration on page load.
 *
 * Organization is resolved from request context (subdomain, custom domain,
 * or X-Org-Slug header) by the OrgResolverMiddleware, same as public session
 * endpoints.
 */
final readonly class PublicGetAppearanceHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetAppearanceUseCase $useCase,
        private JsonResponseFactory  $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId = (int) $request->getAttribute('nene2.org.id', 0);

        $appearance = $this->useCase->execute($orgId);

        return $this->response->create(GetAppearanceHandler::serialize($appearance));
    }
}
