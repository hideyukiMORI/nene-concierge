<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

/**
 * Evaluates a condition node's rules against the current session variables.
 *
 * Each condition node's data_json is expected to contain:
 * {
 *   "conditions": [
 *     {"variable": "name", "operator": "eq", "value": "Alice"}
 *   ],
 *   "match": "all"   // "all" (AND) | "any" (OR) — default "all"
 * }
 *
 * Supported operators:
 *  - eq       : variable === value (strict string comparison)
 *  - neq      : variable !== value
 *  - contains : str_contains(variable, value)
 *  - exists   : variable key is set and non-empty
 *  - not_exists: variable key is unset or empty
 */
final readonly class ConditionEvaluator
{
    /**
     * @param array<string, mixed>  $nodeData      The condition node's data array
     * @param array<string, string> $variables     Session variables
     */
    public function evaluate(array $nodeData, array $variables): bool
    {
        /** @var list<array<string, string>> $conditions */
        $conditions = (array) ($nodeData['conditions'] ?? []);
        $match      = (string) ($nodeData['match'] ?? 'all');

        if ($conditions === []) {
            return true; // No conditions → always true (pass-through)
        }

        $results = array_map(
            fn (array $condition) => $this->evaluateOne($condition, $variables),
            $conditions,
        );

        return $match === 'any'
            ? in_array(true, $results, true)
            : !in_array(false, $results, true);
    }

    /**
     * @param array<string, string> $condition
     * @param array<string, string> $variables
     */
    private function evaluateOne(array $condition, array $variables): bool
    {
        $variable = (string) ($condition['variable'] ?? '');
        $operator = (string) ($condition['operator'] ?? 'eq');
        $expected = (string) ($condition['value'] ?? '');
        $actual   = $variables[$variable] ?? null;

        return match ($operator) {
            'eq'         => $actual === $expected,
            'neq'        => $actual !== $expected,
            'contains'   => $actual !== null && str_contains($actual, $expected),
            'exists'     => isset($variables[$variable]) && $variables[$variable] !== '',
            'not_exists' => !isset($variables[$variable]) || $variables[$variable] === '',
            default      => false,
        };
    }
}
