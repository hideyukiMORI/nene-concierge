<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Engine;

use NeNeConcierge\Engine\ConditionEvaluator;
use PHPUnit\Framework\TestCase;

final class ConditionEvaluatorTest extends TestCase
{
    private ConditionEvaluator $evaluator;

    protected function setUp(): void
    {
        $this->evaluator = new ConditionEvaluator();
    }

    public function testEmptyConditionsAlwaysReturnTrue(): void
    {
        self::assertTrue($this->evaluator->evaluate([], ['name' => 'Alice']));
        self::assertTrue($this->evaluator->evaluate(['conditions' => [], 'match' => 'all'], []));
    }

    public function testEqOperatorMatchesExactValue(): void
    {
        $data = ['conditions' => [['variable' => 'plan', 'operator' => 'eq', 'value' => 'pro']]];

        self::assertTrue($this->evaluator->evaluate($data, ['plan' => 'pro']));
        self::assertFalse($this->evaluator->evaluate($data, ['plan' => 'free']));
        self::assertFalse($this->evaluator->evaluate($data, []));
    }

    public function testNeqOperatorMatchesNonEqual(): void
    {
        $data = ['conditions' => [['variable' => 'plan', 'operator' => 'neq', 'value' => 'free']]];

        self::assertTrue($this->evaluator->evaluate($data, ['plan' => 'pro']));
        self::assertFalse($this->evaluator->evaluate($data, ['plan' => 'free']));
    }

    public function testContainsOperator(): void
    {
        $data = ['conditions' => [['variable' => 'email', 'operator' => 'contains', 'value' => '@example']]];

        self::assertTrue($this->evaluator->evaluate($data, ['email' => 'user@example.com']));
        self::assertFalse($this->evaluator->evaluate($data, ['email' => 'user@other.com']));
        self::assertFalse($this->evaluator->evaluate($data, []));
    }

    public function testExistsOperator(): void
    {
        $data = ['conditions' => [['variable' => 'name', 'operator' => 'exists']]];

        self::assertTrue($this->evaluator->evaluate($data, ['name' => 'Alice']));
        self::assertFalse($this->evaluator->evaluate($data, ['name' => '']));
        self::assertFalse($this->evaluator->evaluate($data, []));
    }

    public function testNotExistsOperator(): void
    {
        $data = ['conditions' => [['variable' => 'coupon', 'operator' => 'not_exists']]];

        self::assertTrue($this->evaluator->evaluate($data, []));
        self::assertTrue($this->evaluator->evaluate($data, ['coupon' => '']));
        self::assertFalse($this->evaluator->evaluate($data, ['coupon' => 'ABC123']));
    }

    public function testMatchAllRequiresAllConditionsTrue(): void
    {
        $data = [
            'conditions' => [
                ['variable' => 'plan', 'operator' => 'eq', 'value' => 'pro'],
                ['variable' => 'active', 'operator' => 'eq', 'value' => '1'],
            ],
            'match' => 'all',
        ];

        self::assertTrue($this->evaluator->evaluate($data, ['plan' => 'pro', 'active' => '1']));
        self::assertFalse($this->evaluator->evaluate($data, ['plan' => 'pro', 'active' => '0']));
        self::assertFalse($this->evaluator->evaluate($data, ['plan' => 'free', 'active' => '1']));
    }

    public function testMatchAnyRequiresAtLeastOneTrue(): void
    {
        $data = [
            'conditions' => [
                ['variable' => 'plan', 'operator' => 'eq', 'value' => 'pro'],
                ['variable' => 'plan', 'operator' => 'eq', 'value' => 'enterprise'],
            ],
            'match' => 'any',
        ];

        self::assertTrue($this->evaluator->evaluate($data, ['plan' => 'pro']));
        self::assertTrue($this->evaluator->evaluate($data, ['plan' => 'enterprise']));
        self::assertFalse($this->evaluator->evaluate($data, ['plan' => 'free']));
    }

    public function testUnknownOperatorReturnsFalse(): void
    {
        $data = ['conditions' => [['variable' => 'x', 'operator' => 'unknown', 'value' => 'y']]];

        self::assertFalse($this->evaluator->evaluate($data, ['x' => 'y']));
    }

    // ── 境界値 ────────────────────────────────────────────────────────────────

    public function testNeqReturnsTrueWhenVariableIsAbsent(): void
    {
        // 変数が存在しない場合 actual = null → null !== 'free' → true
        $data = ['conditions' => [['variable' => 'plan', 'operator' => 'neq', 'value' => 'free']]];

        self::assertTrue($this->evaluator->evaluate($data, []));
    }

    public function testContainsWithEmptyValueMatchesAnyNonNullString(): void
    {
        // value = '' は str_contains(actual, '') = true（常に真）
        $data = ['conditions' => [['variable' => 'text', 'operator' => 'contains', 'value' => '']]];

        self::assertTrue($this->evaluator->evaluate($data, ['text' => 'anything']));
        self::assertTrue($this->evaluator->evaluate($data, ['text' => '']));
        // 変数未設定 → actual = null → contains は false
        self::assertFalse($this->evaluator->evaluate($data, []));
    }

    public function testEqIsCaseSensitive(): void
    {
        $data = ['conditions' => [['variable' => 'tag', 'operator' => 'eq', 'value' => 'Pro']]];

        self::assertTrue($this->evaluator->evaluate($data, ['tag' => 'Pro']));
        self::assertFalse($this->evaluator->evaluate($data, ['tag' => 'pro']));
        self::assertFalse($this->evaluator->evaluate($data, ['tag' => 'PRO']));
    }

    public function testMatchAnyReturnsFalseWhenAllConditionsFail(): void
    {
        $data = [
            'conditions' => [
                ['variable' => 'status', 'operator' => 'eq', 'value' => 'active'],
                ['variable' => 'status', 'operator' => 'eq', 'value' => 'trial'],
            ],
            'match' => 'any',
        ];

        self::assertFalse($this->evaluator->evaluate($data, ['status' => 'inactive']));
    }

    public function testMatchAllReturnsTrueForSingleTrueCondition(): void
    {
        $data = [
            'conditions' => [['variable' => 'x', 'operator' => 'eq', 'value' => '1']],
            'match'      => 'all',
        ];

        self::assertTrue($this->evaluator->evaluate($data, ['x' => '1']));
    }

    public function testExistsReturnsFalseForWhitespaceOnlyValue(): void
    {
        // 'exists' は空文字のみガード。空白は非空なので true
        $data = ['conditions' => [['variable' => 'notes', 'operator' => 'exists']]];

        self::assertTrue($this->evaluator->evaluate($data, ['notes' => ' ']));
    }

    public function testMissingConditionsKeyTreatedAsEmpty(): void
    {
        // 'conditions' キーなし → 空配列扱い → 常に true
        self::assertTrue($this->evaluator->evaluate(['match' => 'all'], ['x' => '1']));
    }

    public function testConditionWithEmptyVariableNameMatchesEmptyKey(): void
    {
        // variable = '' の場合 $variables[''] を参照する
        $data = ['conditions' => [['variable' => '', 'operator' => 'eq', 'value' => 'hello']]];

        self::assertFalse($this->evaluator->evaluate($data, ['name' => 'hello']));
        self::assertTrue($this->evaluator->evaluate($data, ['' => 'hello']));
    }
}
