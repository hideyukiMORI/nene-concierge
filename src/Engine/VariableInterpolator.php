<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

/**
 * Replaces {{variable_name}} placeholders in a string with session variable values.
 *
 * Unresolved placeholders (variable not in the map) are left as-is.
 */
final readonly class VariableInterpolator
{
    /**
     * @param array<string, string> $variables
     */
    public function interpolate(string $text, array $variables): string
    {
        return preg_replace_callback(
            '/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/',
            static function (array $matches) use ($variables): string {
                return $variables[$matches[1]] ?? $matches[0];
            },
            $text,
        ) ?? $text;
    }
}
