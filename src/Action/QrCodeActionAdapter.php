<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;

/**
 * QR コードアクションアダプター。
 *
 * action ノードの params:
 *   content  (string) — QR コードに埋め込む文字列（変数補間済み）
 *   variable (string) — 出力先セッション変数名（省略時: qr_url）
 *   size     (int)    — 画像サイズ px（省略時: 200）
 *
 * 戻り値: { [variable]: 'data:image/png;base64,...' }
 * これがセッション変数にマージされ、後続の message ノードで {{qr_url}} として参照できる。
 */
final readonly class QrCodeActionAdapter implements ActionAdapterInterface
{
    public function adapterType(): string
    {
        return 'qr';
    }

    /** @param array<string, mixed> $params */
    public function execute(array $params, int $organizationId): array
    {
        $content  = (string) ($params['content']  ?? '');
        $variable = (string) ($params['variable'] ?? 'qr_url');
        $size     = max(64, min(800, (int) ($params['size'] ?? 200)));

        if ($content === '') {
            throw new ActionException('QrCodeActionAdapter: content must not be empty.');
        }

        $result = (new Builder(
            writer:               new PngWriter(),
            data:                 $content,
            encoding:             new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::High,
            size:                 $size,
            margin:               10,
            roundBlockSizeMode:   RoundBlockSizeMode::Margin,
        ))->build();

        $dataUri = 'data:image/png;base64,' . base64_encode($result->getString());

        return [$variable => $dataUri];
    }
}
