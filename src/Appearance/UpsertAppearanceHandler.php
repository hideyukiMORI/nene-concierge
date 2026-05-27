<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * PUT /api/v1/appearance
 *
 * Full replacement of the organization's widget appearance settings.
 * Any field not provided in the request body keeps the stored value (or the
 * default value when no settings have been saved yet).
 *
 * Request body (all fields optional):
 * {
 *   "color_primary":   "#2563eb",
 *   "color_secondary": "#ffffff",
 *   "position":        "bottom-right",
 *   "trigger_type":    "page_load",
 *   "icon_url":        null,
 *   "welcome_text":    null
 * }
 */
final readonly class UpsertAppearanceHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetAppearanceUseCase    $getUseCase,
        private UpsertAppearanceUseCase $upsertUseCase,
        private JsonResponseFactory     $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId   = (int) $request->getAttribute('nene2.org.id', 0);
        $body    = JsonRequestBodyParser::parse($request);
        $current = $this->getUseCase->execute($orgId);
        $errors  = [];

        // ── color_primary ──────────────────────────────────────────────────────
        $colorPrimary = array_key_exists('color_primary', $body)
            ? (string) $body['color_primary']
            : $current->colorPrimary;

        if (!$this->isValidHexColor($colorPrimary)) {
            $errors[] = new ValidationError('color_primary', 'color_primary must be a 6-digit hex color (e.g. #2563eb).', 'invalid');
        }

        // ── color_secondary ────────────────────────────────────────────────────
        $colorSecondary = array_key_exists('color_secondary', $body)
            ? (string) $body['color_secondary']
            : $current->colorSecondary;

        if (!$this->isValidHexColor($colorSecondary)) {
            $errors[] = new ValidationError('color_secondary', 'color_secondary must be a 6-digit hex color (e.g. #ffffff).', 'invalid');
        }

        // ── position ───────────────────────────────────────────────────────────
        $positionRaw = array_key_exists('position', $body)
            ? (string) $body['position']
            : $current->position->value;

        $position = AppearancePosition::tryFrom($positionRaw);

        if ($position === null) {
            $errors[] = new ValidationError(
                'position',
                'position must be one of: bottom-right, bottom-left, top-right, top-left.',
                'invalid',
            );
            $position = AppearancePosition::BottomRight; // fallback; never used (we throw below)
        }

        // ── trigger_type ───────────────────────────────────────────────────────
        $triggerRaw = array_key_exists('trigger_type', $body)
            ? (string) $body['trigger_type']
            : $current->trigger->value;

        $trigger = AppearanceTrigger::tryFrom($triggerRaw);

        if ($trigger === null) {
            $errors[] = new ValidationError(
                'trigger_type',
                'trigger_type must be one of: page_load, scroll, exit_intent, manual.',
                'invalid',
            );
            $trigger = AppearanceTrigger::PageLoad; // fallback; never used (we throw below)
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        // ── nullable optional fields ───────────────────────────────────────────
        $iconUrl = array_key_exists('icon_url', $body)
            ? (isset($body['icon_url']) ? (string) $body['icon_url'] : null)
            : $current->iconUrl;

        $welcomeText = array_key_exists('welcome_text', $body)
            ? (isset($body['welcome_text']) ? (string) $body['welcome_text'] : null)
            : $current->welcomeText;

        $updated = new Appearance(
            organizationId: $orgId,
            colorPrimary:   $colorPrimary,
            colorSecondary: $colorSecondary,
            position:       $position,
            trigger:        $trigger,
            iconUrl:        $iconUrl,
            welcomeText:    $welcomeText,
        );

        $this->upsertUseCase->execute($updated);

        return $this->response->create(GetAppearanceHandler::serialize($updated));
    }

    private function isValidHexColor(string $value): bool
    {
        return (bool) preg_match('/^#[0-9a-fA-F]{6}$/', $value);
    }
}
