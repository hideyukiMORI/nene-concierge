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
}
