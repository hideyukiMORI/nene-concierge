<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Action;

use NeNeConcierge\Action\ActionDispatcher;
use NeNeConcierge\Action\ActionException;
use NeNeConcierge\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

final class ActionDispatcherTest extends TestCase
{
    private InMemoryActionLogRepository $logRepo;

    protected function setUp(): void
    {
        $this->logRepo = new InMemoryActionLogRepository();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeDispatcher(SpyActionAdapter ...$adapters): ActionDispatcher
    {
        return new ActionDispatcher(array_values($adapters), $this->logRepo, new FixedClock());
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    public function testDispatchCallsMatchingAdapter(): void
    {
        $adapter    = new SpyActionAdapter('http');
        $dispatcher = $this->makeDispatcher($adapter);

        $dispatcher->dispatch(
            ['adapter' => 'http', 'params' => ['url' => 'https://example.com', 'method' => 'POST']],
            1,
            'session-1',
            10,
            'node-a',
        );

        $this->assertTrue($adapter->called);
        $this->assertSame(['url' => 'https://example.com', 'method' => 'POST'], $adapter->receivedParams);
    }

    public function testSuccessfulDispatchWritesSuccessLog(): void
    {
        $adapter    = new SpyActionAdapter('email');
        $dispatcher = $this->makeDispatcher($adapter);

        $dispatcher->dispatch(['adapter' => 'email', 'params' => []], 1, 'sess-1', 5, 'n1');

        $this->assertCount(1, $this->logRepo->logs);
        $this->assertSame('success', $this->logRepo->logs[0]->status);
        $this->assertSame('email', $this->logRepo->logs[0]->adapter);
        $this->assertNull($this->logRepo->logs[0]->errorMessage);
    }

    public function testFailingAdapterWritesFailureLogAndRethrows(): void
    {
        $adapter    = new SpyActionAdapter('slack', throws: true);
        $dispatcher = $this->makeDispatcher($adapter);

        $this->expectException(ActionException::class);
        $this->expectExceptionMessage('SpyActionAdapter: forced failure.');

        try {
            $dispatcher->dispatch(['adapter' => 'slack', 'params' => []], 1, 'sess-2', 5, 'n2');
        } finally {
            $this->assertCount(1, $this->logRepo->logs);
            $this->assertSame('failure', $this->logRepo->logs[0]->status);
            $this->assertSame('SpyActionAdapter: forced failure.', $this->logRepo->logs[0]->errorMessage);
        }
    }

    public function testUnknownAdapterWritesFailureLogAndThrows(): void
    {
        $dispatcher = $this->makeDispatcher();   // no adapters registered

        $this->expectException(ActionException::class);

        try {
            $dispatcher->dispatch(['adapter' => 'chatwork', 'params' => []], 1, 'sess-3', 5, 'n3');
        } finally {
            $this->assertCount(1, $this->logRepo->logs);
            $this->assertSame('failure', $this->logRepo->logs[0]->status);
            $this->assertStringContainsString('chatwork', (string) $this->logRepo->logs[0]->errorMessage);
        }
    }

    public function testMissingAdapterKeyFallsBackToEmptyString(): void
    {
        $dispatcher = $this->makeDispatcher();

        $this->expectException(ActionException::class);

        try {
            $dispatcher->dispatch([], 1, 'sess-4', 5, 'n4');
        } finally {
            $this->assertCount(1, $this->logRepo->logs);
            $this->assertSame('unknown', $this->logRepo->logs[0]->adapter);
        }
    }

    public function testDispatchSelectsFirstMatchingAdapterWhenMultipleRegistered(): void
    {
        $http  = new SpyActionAdapter('http');
        $email = new SpyActionAdapter('email');
        $slack = new SpyActionAdapter('slack');
        $dispatcher = $this->makeDispatcher($http, $email, $slack);

        $dispatcher->dispatch(['adapter' => 'email', 'params' => []], 1, 'sess-5', 5, 'n5');

        $this->assertFalse($http->called);
        $this->assertTrue($email->called);
        $this->assertFalse($slack->called);
    }
}
