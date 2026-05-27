<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/appearance
 *
 * Returns the organization's current widget appearance settings.
 * If no settings have been saved yet, the default values are returned.
 */
final readonly class GetAppearanceHandler implements RequestHandlerInterface
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

        return $this->response->create(self::serialize($appearance));
    }

    /** @return array<string, mixed> */
    public static function serialize(Appearance $a): array
    {
        return [
            'color_primary'   => $a->colorPrimary,
            'color_secondary' => $a->colorSecondary,
            'position'        => $a->position->value,
            'trigger_type'    => $a->trigger->value,
            'icon_url'        => $a->iconUrl,
            'welcome_text'    => $a->welcomeText,
        ];
    }
}
