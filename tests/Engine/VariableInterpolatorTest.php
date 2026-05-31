<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Engine;

use NeNeConcierge\Engine\VariableInterpolator;
use PHPUnit\Framework\TestCase;

final class VariableInterpolatorTest extends TestCase
{
    private VariableInterpolator $interpolator;

    protected function setUp(): void
    {
        $this->interpolator = new VariableInterpolator();
    }

    public function testReplacesKnownVariable(): void
    {
        $result = $this->interpolator->interpolate('Hello, {{name}}!', ['name' => 'Alice']);
        self::assertSame('Hello, Alice!', $result);
    }

    public function testReplacesMultipleVariables(): void
    {
        $result = $this->interpolator->interpolate(
            '{{greeting}}, {{name}}! Your plan is {{plan}}.',
            ['greeting' => 'Hi', 'name' => 'Bob', 'plan' => 'pro'],
        );
        self::assertSame('Hi, Bob! Your plan is pro.', $result);
    }

    public function testLeavesUnknownPlaceholdersAsIs(): void
    {
        $result = $this->interpolator->interpolate('Hello, {{name}}!', []);
        self::assertSame('Hello, {{name}}!', $result);
    }

    public function testTextWithNoPlaceholdersIsUnchanged(): void
    {
        $result = $this->interpolator->interpolate('No placeholders here.', ['name' => 'Alice']);
        self::assertSame('No placeholders here.', $result);
    }

    public function testEmptyStringReturnsEmpty(): void
    {
        self::assertSame('', $this->interpolator->interpolate('', ['x' => 'y']));
    }

    // ── 境界値 ────────────────────────────────────────────────────────────────

    public function testDuplicatePlaceholderReplacedBoth(): void
    {
        $result = $this->interpolator->interpolate('{{name}} is {{name}}.', ['name' => 'Alice']);
        self::assertSame('Alice is Alice.', $result);
    }

    public function testVariableValueContainingBraces(): void
    {
        // 値自体が {{...}} を含んでも二重展開されない
        $result = $this->interpolator->interpolate('Hello {{name}}!', ['name' => '{{Bob}}']);
        self::assertSame('Hello {{Bob}}!', $result);
    }

    public function testPlaceholderWithLeadingDigitNotReplaced(): void
    {
        // 正規表現 [a-zA-Z_][a-zA-Z0-9_]* の先頭は数字不可
        $result = $this->interpolator->interpolate('{{1var}}', ['1var' => 'x']);
        self::assertSame('{{1var}}', $result);
    }

    public function testPlaceholderWithUnderscoreIsReplaced(): void
    {
        $result = $this->interpolator->interpolate('{{first_name}}', ['first_name' => 'Taro']);
        self::assertSame('Taro', $result);
    }

    public function testPlaceholderWithSpacesNotReplaced(): void
    {
        // {{ name }} はスペースあり → マッチしない
        $result = $this->interpolator->interpolate('{{ name }}', ['name' => 'Alice']);
        self::assertSame('{{ name }}', $result);
    }

    public function testEmptyVariableValueReplacesPlaceholder(): void
    {
        $result = $this->interpolator->interpolate('Hello {{name}}!', ['name' => '']);
        self::assertSame('Hello !', $result);
    }

    public function testOnlyPartialOverlapVariablesNotAffected(): void
    {
        // 'na' と 'name' は別変数
        $result = $this->interpolator->interpolate('{{name}}', ['na' => 'short', 'name' => 'correct']);
        self::assertSame('correct', $result);
    }
}
