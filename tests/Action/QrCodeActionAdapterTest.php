<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Action;

use NeNeConcierge\Action\ActionException;
use NeNeConcierge\Action\QrCodeActionAdapter;
use PHPUnit\Framework\TestCase;

final class QrCodeActionAdapterTest extends TestCase
{
    private QrCodeActionAdapter $adapter;

    protected function setUp(): void
    {
        $this->adapter = new QrCodeActionAdapter();
    }

    public function testAdapterTypeIsQr(): void
    {
        $this->assertSame('qr', $this->adapter->adapterType());
    }

    public function testGeneratesDataUri(): void
    {
        $result = $this->adapter->execute(['content' => 'https://example.com'], 1);

        $this->assertArrayHasKey('qr_url', $result);
        $this->assertStringStartsWith('data:image/png;base64,', $result['qr_url']);
    }

    public function testUsesCustomVariableName(): void
    {
        $result = $this->adapter->execute([
            'content'  => 'https://example.com',
            'variable' => 'coupon_qr',
        ], 1);

        $this->assertArrayHasKey('coupon_qr', $result);
        $this->assertArrayNotHasKey('qr_url', $result);
    }

    public function testThrowsOnEmptyContent(): void
    {
        $this->expectException(ActionException::class);
        $this->expectExceptionMessageMatches('/content must not be empty/');

        $this->adapter->execute(['content' => ''], 1);
    }

    public function testThrowsWhenContentMissing(): void
    {
        $this->expectException(ActionException::class);

        $this->adapter->execute([], 1);
    }

    public function testDataUriContainsValidBase64(): void
    {
        $result   = $this->adapter->execute(['content' => 'test'], 1);
        $dataUri  = $result['qr_url'];
        $b64      = substr($dataUri, strlen('data:image/png;base64,'));

        $decoded = base64_decode($b64, true);
        $this->assertNotFalse($decoded);
        // PNG magic bytes: 0x89 0x50 0x4E 0x47
        $this->assertSame("\x89PNG", substr($decoded, 0, 4));
    }

    public function testCustomSizeIsRespected(): void
    {
        // Both sizes should succeed without error
        $small = $this->adapter->execute(['content' => 'hi', 'size' => 64], 1);
        $large = $this->adapter->execute(['content' => 'hi', 'size' => 400], 1);

        $this->assertStringStartsWith('data:image/png;base64,', $small['qr_url']);
        $this->assertStringStartsWith('data:image/png;base64,', $large['qr_url']);
    }
}
