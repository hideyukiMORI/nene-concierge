<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

/**
 * Dummy data seeder for layout / UX validation.
 *
 * Idempotent: truncates target tables and re-inserts.
 *
 * Populates:
 *   - users               (extends — adds editor / viewer users for varied audit trail)
 *   - organization_users  (binds new users to default org)
 *   - action_credentials  (8 records, all 4 adapters)
 *   - scenarios           (extends existing — keeps current rows, adds realistic ones)
 *   - sessions            (~40, mixed outcomes spread over 7 days)
 *   - messages            (3-6 per session, realistic Japanese chat flows)
 *   - action_logs         (~60, mixed adapters, ~15% failures with varied error msgs)
 *   - scenario_revisions  (~150-220, varied operations / users / timestamps over 30 days)
 *
 * Run:
 *   docker compose exec app vendor/bin/phinx seed:run -s DummyDataSeeder
 */
final class DummyDataSeeder extends AbstractSeed
{
    private const ORG_ID = 1;

    /** Anchor "now" for deterministic timestamp generation. */
    private const NOW = '2026-05-28 15:30:00';

    public function run(): void
    {
        $userIds     = $this->seedUsers();
        $this->seedCredentials();
        $scenarioIds = $this->seedScenarios();
        $sessions    = $this->seedSessionsAndMessages($scenarioIds);
        $this->seedActionLogs($scenarioIds, $sessions);
        $this->seedScenarioRevisions($scenarioIds, $userIds);
    }

    // ── users (extend) + organization_users ───────────────────────────────────

    /**
     * Ensure realistic operator users exist so audit trail / history shows variety.
     *
     * @return array<int, array{id: int, email: string}>
     */
    private function seedUsers(): array
    {
        $passwordHash = password_hash('nene1234', PASSWORD_DEFAULT);
        $candidates   = [
            ['email' => 'editor.alice@nene-concierge.local', 'role' => 'editor'],
            ['email' => 'editor.bob@nene-concierge.local',   'role' => 'editor'],
            ['email' => 'viewer.carol@nene-concierge.local', 'role' => 'viewer'],
            ['email' => 'editor.dave@nene-concierge.local',  'role' => 'editor'],
        ];
        $existingEmails = array_column(
            $this->fetchAll('SELECT email FROM users'),
            'email',
        );
        $rows = [];
        foreach ($candidates as $c) {
            if (!in_array($c['email'], $existingEmails, true)) {
                $rows[] = [
                    'email'         => $c['email'],
                    'password_hash' => $passwordHash,
                    'role'          => $c['role'],
                    'status'        => 'active',
                    'created_at'    => self::NOW,
                    'updated_at'    => self::NOW,
                ];
            }
        }
        if ($rows !== []) {
            $this->insert('users', $rows);
        }

        $all = $this->fetchAll('SELECT id, email FROM users ORDER BY id');
        $userIds = array_map(static fn ($r) => ['id' => (int) $r['id'], 'email' => (string) $r['email']], $all);

        // Bind users to org if not already
        $existingMembers = array_column(
            $this->fetchAll('SELECT user_id FROM organization_users WHERE organization_id = ' . self::ORG_ID),
            'user_id',
        );
        $existingMembers = array_map('intval', $existingMembers);
        $memberRows = [];
        foreach ($userIds as $u) {
            if (!in_array($u['id'], $existingMembers, true)) {
                $memberRows[] = [
                    'organization_id' => self::ORG_ID,
                    'user_id'         => $u['id'],
                    'role'            => 'owner',
                    'created_at'      => self::NOW,
                ];
            }
        }
        if ($memberRows !== []) {
            $this->insert('organization_users', $memberRows);
        }

        return $userIds;
    }

    // ── action_credentials ────────────────────────────────────────────────────

    private function seedCredentials(): void
    {
        $now = self::NOW;
        $this->table('action_credentials')->truncate();

        $rows = [
            ['organization_id' => self::ORG_ID, 'name' => 'Slack #cs-notify',        'adapter' => 'slack',    'config_json' => json_encode(['webhook_url' => 'https://hooks.slack.com/services/T00/B00/XX'], JSON_UNESCAPED_SLASHES), 'created_at' => $now, 'updated_at' => $now],
            ['organization_id' => self::ORG_ID, 'name' => 'Slack #sales-leads',      'adapter' => 'slack',    'config_json' => json_encode(['webhook_url' => 'https://hooks.slack.com/services/T00/B01/YY'], JSON_UNESCAPED_SLASHES), 'created_at' => $now, 'updated_at' => $now],
            ['organization_id' => self::ORG_ID, 'name' => '問い合わせ受信メール',     'adapter' => 'email',    'config_json' => json_encode(['host' => 'smtp.example.com', 'port' => 587, 'user' => 'noreply@example.com'], JSON_UNESCAPED_UNICODE), 'created_at' => $now, 'updated_at' => $now],
            ['organization_id' => self::ORG_ID, 'name' => '営業通知メール',           'adapter' => 'email',    'config_json' => json_encode(['host' => 'smtp.example.com', 'port' => 587, 'user' => 'sales@example.com'], JSON_UNESCAPED_UNICODE), 'created_at' => $now, 'updated_at' => $now],
            ['organization_id' => self::ORG_ID, 'name' => 'AWS SES Bulk Mail',       'adapter' => 'email',    'config_json' => json_encode(['region' => 'ap-northeast-1', 'sender' => 'bulk@example.com'], JSON_UNESCAPED_UNICODE), 'created_at' => $now, 'updated_at' => $now],
            ['organization_id' => self::ORG_ID, 'name' => '社内 Webhook (Notion)',   'adapter' => 'http',     'config_json' => json_encode(['url' => 'https://api.notion.com/v1/pages', 'method' => 'POST'], JSON_UNESCAPED_SLASHES), 'created_at' => $now, 'updated_at' => $now],
            ['organization_id' => self::ORG_ID, 'name' => 'Stripe Webhook',          'adapter' => 'http',     'config_json' => json_encode(['url' => 'https://api.example.com/stripe-hook', 'method' => 'POST'], JSON_UNESCAPED_SLASHES), 'created_at' => $now, 'updated_at' => $now],
            ['organization_id' => self::ORG_ID, 'name' => 'Chatwork サポート Room',  'adapter' => 'chatwork', 'config_json' => json_encode(['room_id' => '123456789', 'token' => '***'], JSON_UNESCAPED_UNICODE), 'created_at' => $now, 'updated_at' => $now],
        ];
        $this->insert('action_credentials', $rows);
    }

    // ── scenarios (extend) ────────────────────────────────────────────────────

    /** @return int[] all scenario ids (existing + newly inserted) */
    private function seedScenarios(): array
    {
        $now = self::NOW;
        $existing = $this->fetchAll('SELECT id FROM scenarios');
        $ids = array_map(static fn ($r) => (int)$r['id'], $existing);

        $candidates = [
            ['name' => 'お問い合わせフロー',        'description' => '一般的な問い合わせ受付。商品/配送/返品/その他に分岐', 'status' => 'published'],
            ['name' => '採用情報フロー',            'description' => '募集職種の案内とエントリー受付',                      'status' => 'draft'],
            ['name' => 'カスタマーサポート / 初期', 'description' => 'ログイン・支払い・利用方法のセルフサポート分岐',      'status' => 'published'],
            ['name' => '資料請求',                  'description' => 'BtoB リード獲得用 — 会社名・連絡先取得',             'status' => 'draft'],
            ['name' => '2026 春キャンペーン',       'description' => 'クーポン配布キャンペーン (5月限定)',                  'status' => 'published'],
            ['name' => '予約フロー',                'description' => '店舗予約 — 日時/連絡先取得',                          'status' => 'published'],
        ];
        $existingNames = array_column(
            $this->fetchAll('SELECT name FROM scenarios'),
            'name',
        );
        $rows = [];
        foreach ($candidates as $c) {
            if (!in_array($c['name'], $existingNames, true)) {
                $rows[] = array_merge(
                    ['organization_id' => self::ORG_ID],
                    $c,
                    ['created_at' => $now, 'updated_at' => $now],
                );
            }
        }
        if ($rows !== []) {
            $this->insert('scenarios', $rows);
        }
        // Re-fetch to get the inserted ids
        $all = $this->fetchAll('SELECT id FROM scenarios ORDER BY id');
        return array_map(static fn ($r) => (int)$r['id'], $all);
    }

    // ── sessions + messages ───────────────────────────────────────────────────

    /**
     * @param int[] $scenarioIds
     * @return array<int, array{id: string, scenario_id: int, started_at: string, outcome: string}>
     */
    private function seedSessionsAndMessages(array $scenarioIds): array
    {
        $this->table('session_node_events')->truncate();
        $this->table('messages')->truncate();
        $this->table('sessions')->truncate();

        $threads = $this->conversationThreads();
        $outcomes  = ['active', 'completed', 'dropped', 'converted'];
        $weights   = [3, 8, 4, 6]; // bias toward converted/completed
        $weightSum = array_sum($weights);

        $sessionRows = [];
        $messageRows = [];
        $sessions    = [];

        $anchor   = new DateTimeImmutable(self::NOW);
        $nMinutes = 60 * 24 * 7; // 7 days backwards

        for ($i = 0; $i < 40; $i++) {
            $sid          = $this->uuid4();
            $scenarioId   = $scenarioIds[$i % count($scenarioIds)];
            $startedAtAgo = (int) ($nMinutes * (1 - sqrt(mt_rand(0, 1000) / 1000))); // bias to recent
            $startedAt    = $anchor->modify(sprintf('-%d minutes', $startedAtAgo));
            $outcome      = $this->weightedPick($outcomes, $weights, $weightSum);

            // Build conversation
            $threadKey = (string)$scenarioId; // pick thread for this scenario id
            $thread    = $threads[$threadKey] ?? $threads['default'];
            $msgCount  = min(count($thread), 3 + ($i % 4));
            $convo     = array_slice($thread, 0, $msgCount);

            // Determine duration
            $durationS = match ($outcome) {
                'active'    => null,
                'dropped'   => 30 + mt_rand(0, 120),
                'completed' => 90 + mt_rand(0, 540),
                'converted' => 180 + mt_rand(0, 720),
                default     => 60,
            };
            $endedAt = $durationS === null
                ? null
                : $startedAt->modify(sprintf('+%d seconds', $durationS));

            $hasConv = $outcome === 'converted' ? 1 : 0;
            $vars    = $this->variablesFor($scenarioId, $outcome);

            $sessionRows[] = [
                'id'              => $sid,
                'organization_id' => self::ORG_ID,
                'scenario_id'     => $scenarioId,
                'current_node_id' => $outcome === 'active' ? 'n2' : null,
                'outcome'         => $outcome,
                'has_conversion'  => $hasConv,
                'variables_json'  => json_encode($vars, JSON_UNESCAPED_UNICODE),
                'started_at'      => $startedAt->format('Y-m-d H:i:s'),
                'ended_at'        => $endedAt?->format('Y-m-d H:i:s'),
                'created_at'      => $startedAt->format('Y-m-d H:i:s'),
            ];

            // Messages — interleave bot + visitor with cumulative monotonic offsets
            $cumS = 0;
            foreach ($convo as $idx => $msg) {
                $cumS += 8 + mt_rand(0, 18);
                $createdAt = $startedAt->modify(sprintf('+%d seconds', $cumS));
                $messageRows[] = [
                    'organization_id' => self::ORG_ID,
                    'session_id'      => $sid,
                    'node_id'         => 'n' . ($idx + 1),
                    'role'            => $msg['role'],
                    'content'         => $msg['content'],
                    'created_at'      => $createdAt->format('Y-m-d H:i:s'),
                ];
            }

            $sessions[] = [
                'id'          => $sid,
                'scenario_id' => $scenarioId,
                'started_at'  => $startedAt->format('Y-m-d H:i:s'),
                'outcome'     => $outcome,
            ];
        }

        // Bulk insert — split into chunks for messages (could be 200+)
        $this->insert('sessions', $sessionRows);
        foreach (array_chunk($messageRows, 100) as $chunk) {
            $this->insert('messages', $chunk);
        }

        return $sessions;
    }

    // ── action_logs ───────────────────────────────────────────────────────────

    /**
     * @param int[] $scenarioIds
     * @param array<int, array{id: string, scenario_id: int, started_at: string, outcome: string}> $sessions
     */
    private function seedActionLogs(array $scenarioIds, array $sessions): void
    {
        $this->table('action_logs')->truncate();

        $adapters     = ['email', 'slack', 'http', 'chatwork'];
        $adapterWeights = [4, 3, 5, 2];
        $sumA         = array_sum($adapterWeights);
        $errorMsgs    = [
            'email'    => [
                'SMTP timeout: smtp.example.com:587',
                'Connection refused: smtp.example.com:587',
                'AUTH failed: invalid credentials',
                'TLS handshake failed: certificate verify error',
                'Recipient rejected: 550 5.1.1 user unknown',
            ],
            'slack'    => [
                '403 Forbidden — invalid token',
                '404 channel_not_found — #cs-notify',
                '429 rate_limited — retry after 14s',
                'invalid_payload — missing "text" field',
            ],
            'http'     => [
                'ECONNREFUSED — unreachable',
                '500 Internal Server Error',
                '401 Unauthorized — token expired',
                'JSON parse error: unexpected token at line 12',
                'DNS resolution failed: api.example.com',
                'Network timeout after 30s',
                'SSL certificate verify failed',
            ],
            'chatwork' => [
                '401 Unauthorized — API key revoked',
                '404 room not found: 123456789',
                '429 API rate limit exceeded',
            ],
        ];

        $rows  = [];
        $count = 64;
        for ($i = 0; $i < $count; $i++) {
            $session    = $sessions[array_rand($sessions)];
            $adapter    = $this->weightedPick($adapters, $adapterWeights, $sumA);
            $fail       = mt_rand(1, 100) <= 15;  // ~15% failure
            $startedAt  = new DateTimeImmutable($session['started_at']);
            $executedAt = $startedAt->modify(sprintf('+%d seconds', 20 + mt_rand(0, 600)));
            $rows[] = [
                'organization_id' => self::ORG_ID,
                'session_id'      => $session['id'],
                'scenario_id'     => $session['scenario_id'],
                'node_id'         => 'n' . (3 + ($i % 3)),
                'adapter'         => $adapter,
                'status'          => $fail ? 'failure' : 'success',
                'error_message'   => $fail ? $errorMsgs[$adapter][array_rand($errorMsgs[$adapter])] : null,
                'executed_at'     => $executedAt->format('Y-m-d H:i:s'),
            ];
        }
        $this->insert('action_logs', $rows);
    }

    // ── scenario_revisions ────────────────────────────────────────────────────

    /**
     * @param int[]                                        $scenarioIds
     * @param array<int, array{id: int, email: string}>   $userIds
     */
    private function seedScenarioRevisions(array $scenarioIds, array $userIds): void
    {
        $this->table('scenario_revisions')->truncate();

        if ($scenarioIds === [] || $userIds === []) {
            return;
        }

        $operations       = ['update', 'graph_save', 'graph_save', 'status_change', 'update'];
        $anchor           = new DateTimeImmutable(self::NOW);
        $rows             = [];
        $scenarioMeta     = $this->fetchAll('SELECT id, name, description, status FROM scenarios');
        $scenarioByIdMap  = [];
        foreach ($scenarioMeta as $m) {
            $scenarioByIdMap[(int) $m['id']] = $m;
        }

        foreach ($scenarioIds as $scenarioId) {
            $meta = $scenarioByIdMap[$scenarioId] ?? null;
            if ($meta === null) {
                continue;
            }

            $name        = (string) $meta['name'];
            $description = isset($meta['description']) ? (string) $meta['description'] : null;
            $status      = (string) $meta['status'];

            // Each scenario gets between 15 and 35 revisions
            $count    = 15 + mt_rand(0, 20);
            $createdAt = $anchor->modify('-' . (25 + mt_rand(0, 10)) . ' days');
            $rev      = 1;

            // First revision: create
            $creator  = $userIds[array_rand($userIds)];
            $nodeBase = 3 + mt_rand(0, 8);
            $edgeBase = max(0, $nodeBase - 1);
            $rows[] = $this->revisionRow(
                $scenarioId,
                $rev++,
                $creator,
                'create',
                $name,
                $description,
                $status,
                $nodeBase,
                $edgeBase,
                $createdAt,
            );

            // Followup revisions
            for ($i = 1; $i < $count; $i++) {
                $createdAt = $createdAt->modify('+' . (60 + mt_rand(20, 4800)) . ' minutes');
                if ($createdAt > $anchor) {
                    break;
                }
                $user      = $userIds[array_rand($userIds)];
                $op        = $operations[array_rand($operations)];
                $nodeBase += mt_rand(-1, 2);
                if ($nodeBase < 2) {
                    $nodeBase = 2;
                }
                $edgeBase  = max(0, $nodeBase - 1 + mt_rand(-1, 1));

                $rowStatus = $status;
                $rowName   = $name;
                if ($op === 'status_change') {
                    $rowStatus = $status === 'published' ? 'draft' : 'published';
                    $status    = $rowStatus; // future revisions retain the change
                }
                if ($op === 'update' && mt_rand(1, 100) <= 25) {
                    // Occasional rename
                    $rowName = $name . ' v' . (1 + mt_rand(1, 3));
                }

                $rows[] = $this->revisionRow(
                    $scenarioId,
                    $rev++,
                    $user,
                    $op,
                    $rowName,
                    $description,
                    $rowStatus,
                    $nodeBase,
                    $edgeBase,
                    $createdAt,
                );
            }
        }

        if ($rows === []) {
            return;
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            $this->insert('scenario_revisions', $chunk);
        }
    }

    /**
     * @param array{id: int, email: string} $user
     * @return array<string, mixed>
     */
    private function revisionRow(
        int $scenarioId,
        int $revisionNo,
        array $user,
        string $operation,
        string $name,
        ?string $description,
        string $status,
        int $nodeCount,
        int $edgeCount,
        DateTimeImmutable $createdAt,
    ): array {
        return [
            'organization_id' => self::ORG_ID,
            'scenario_id'     => $scenarioId,
            'revision_no'     => $revisionNo,
            'user_id'         => $user['id'],
            'user_email'      => $user['email'],
            'operation'       => $operation,
            'name'            => $name,
            'description'     => $description,
            'status'          => $status,
            'node_count'      => $nodeCount,
            'edge_count'      => $edgeCount,
            'snapshot_json'   => null,
            'created_at'      => $createdAt->format('Y-m-d H:i:s'),
        ];
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function uuid4(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
    }

    /**
     * @param string[] $values
     * @param int[]    $weights
     */
    private function weightedPick(array $values, array $weights, int $sum): string
    {
        $r = mt_rand(1, $sum);
        $acc = 0;
        foreach ($values as $i => $v) {
            $acc += $weights[$i];
            if ($r <= $acc) {
                return $v;
            }
        }
        return $values[0];
    }

    /**
     * Realistic Japanese conversation threads by scenario id.
     * Keyed by scenario id (string) — 'default' is fallback.
     *
     * @return array<string, array<int, array{role: string, content: string}>>
     */
    private function conversationThreads(): array
    {
        return [
            // お問い合わせフロー
            '4' => [
                ['role' => 'bot',     'content' => 'ご用件はなんでしょうか？'],
                ['role' => 'visitor', 'content' => '商品について聞きたいです'],
                ['role' => 'bot',     'content' => 'どの製品についてご質問でしょうか？製品名やカテゴリを教えてください。'],
                ['role' => 'visitor', 'content' => 'スマートウォッチ X3 の在庫について'],
                ['role' => 'bot',     'content' => '在庫を確認しました。現在5台在庫がございます。ご注文をご検討の場合はお名前とメールアドレスをお願いします。'],
                ['role' => 'visitor', 'content' => '山田太郎 / y.taro@example.com'],
                ['role' => 'bot',     'content' => 'ありがとうございます。担当者より24時間以内にご連絡いたします。'],
            ],
            // 採用情報フロー
            '5' => [
                ['role' => 'bot',     'content' => '採用情報の何をご覧になりたいですか？'],
                ['role' => 'visitor', 'content' => '募集職種一覧'],
                ['role' => 'bot',     'content' => '現在募集中の職種は以下です：フロントエンドエンジニア / バックエンドエンジニア / デザイナー / プロダクトマネージャー。詳しく知りたい職種を教えてください。'],
                ['role' => 'visitor', 'content' => 'フロントエンドエンジニア'],
                ['role' => 'bot',     'content' => 'フロントエンドエンジニア — React + TypeScript、5名募集中。年収 600-900万円。応募される場合はメールアドレスと履歴書 URL をお願いします。'],
            ],
            // カスタマーサポート
            '6' => [
                ['role' => 'bot',     'content' => 'どのようなお困りごとでしょうか？'],
                ['role' => 'visitor', 'content' => 'ログインできません'],
                ['role' => 'bot',     'content' => 'パスワードリセットのご案内をお送りします。ご登録のメールアドレスを教えてください。'],
                ['role' => 'visitor', 'content' => 'support-user@example.com'],
                ['role' => 'bot',     'content' => 'メールを送信しました。10分以内に届かない場合は再度お試しください。'],
            ],
            // 資料請求
            '7' => [
                ['role' => 'bot',     'content' => 'どの資料をご希望ですか？'],
                ['role' => 'visitor', 'content' => 'サービス紹介'],
                ['role' => 'bot',     'content' => 'お名前、会社名、メールアドレスをお願いします。'],
                ['role' => 'visitor', 'content' => '田中花子 / 株式会社サンプル / hanako@sample.co.jp'],
                ['role' => 'bot',     'content' => 'ありがとうございます。資料を本日中にメールでお送りします。'],
            ],
            // 春キャンペーン
            '8' => [
                ['role' => 'bot',     'content' => '🌸 春のキャンペーン開催中！全商品 5% オフクーポンをプレゼント。メールアドレスを入力してください。'],
                ['role' => 'visitor', 'content' => 'campaign-user@example.com'],
                ['role' => 'bot',     'content' => 'クーポンコード SPRING2026 をメールでお送りしました。レジでご利用ください。'],
            ],
            // 予約フロー
            '9' => [
                ['role' => 'bot',     'content' => 'ご予約の日時を選択してください。'],
                ['role' => 'visitor', 'content' => '6月3日 14:00'],
                ['role' => 'bot',     'content' => 'お名前と電話番号をお願いします。'],
                ['role' => 'visitor', 'content' => '鈴木一郎 / 090-1234-5678'],
                ['role' => 'bot',     'content' => 'ご予約完了しました。確認メールをお送りします。当日は10分前までにお越しください。'],
            ],
            'default' => [
                ['role' => 'bot',     'content' => 'こんにちは。ご用件をお選びください。'],
                ['role' => 'visitor', 'content' => 'テストです'],
                ['role' => 'bot',     'content' => 'ありがとうございます。担当者にお繋ぎします。'],
            ],
        ];
    }

    /** @return array<string, string> */
    private function variablesFor(int $scenarioId, string $outcome): array
    {
        // Different scenarios collect different variables
        $base = match ($scenarioId) {
            4       => ['inquiry_type' => '商品について', 'product_name' => 'スマートウォッチ X3', 'user_name' => '山田 太郎', 'email' => 'y.taro@example.com'],
            5       => ['interest' => 'frontend engineer', 'name' => '高橋 健太', 'email' => 'kenta.t@example.com', 'github_url' => 'https://github.com/example'],
            6       => ['issue_type' => 'login', 'email' => 'support-user@example.com'],
            7       => ['doc_type' => 'service-overview', 'name' => '田中 花子', 'company' => '株式会社サンプル', 'email' => 'hanako@sample.co.jp'],
            8       => ['email' => 'campaign-user@example.com', 'coupon_code' => 'SPRING2026'],
            9       => ['booking_date' => '2026-06-03', 'booking_time' => '14:00', 'name' => '鈴木 一郎', 'phone' => '090-1234-5678'],
            default => ['note' => 'test session'],
        };
        // partial collection for non-converted
        if (in_array($outcome, ['active', 'dropped'], true)) {
            $base = array_slice($base, 0, max(1, (int)floor(count($base) / 2)), true);
        }
        return $base;
    }
}
