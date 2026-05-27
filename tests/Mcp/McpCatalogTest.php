<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Mcp;

use Nene2\Mcp\LocalMcpToolCatalog;
use PHPUnit\Framework\TestCase;

/**
 * Verifies the integrity of docs/mcp/tools.json.
 *
 * These tests exercise the catalog without starting an HTTP server.
 * They complement (but do not replace) `composer mcp`, which validates
 * the catalog against the OpenAPI spec.
 */
final class McpCatalogTest extends TestCase
{
    private static LocalMcpToolCatalog $catalog;

    public static function setUpBeforeClass(): void
    {
        self::$catalog = new LocalMcpToolCatalog(
            dirname(__DIR__, 2) . '/docs/mcp/tools.json',
        );
    }

    // ── Existence tests ───────────────────────────────────────────────────────

    public function testCatalogLoads(): void
    {
        $tools = self::$catalog->tools();

        $this->assertNotEmpty($tools, 'Catalog must contain at least one tool.');
    }

    public function testAllReadToolsArePresent(): void
    {
        $expected = [
            'getHealth',
            'listOrganizations',
            'getOrganizationById',
            'listScenarios',
            'getScenarioById',
            'getScenarioAnalytics',
            'listActionCredentials',
            'exportScenario',
            'getAppearance',
        ];

        foreach ($expected as $name) {
            $tool = self::$catalog->find($name);
            $this->assertNotNull($tool, "Read tool '{$name}' must be present in the catalog.");
            $this->assertSame('read', $tool['safety'], "Tool '{$name}' must have safety=read.");
        }
    }

    public function testAllWriteToolsArePresent(): void
    {
        $expected = [
            'createOrganization',
            'updateOrganization',
            'createScenario',
            'updateScenario',
            'startPreviewSession',
            'stepPreviewSession',
            'importScenario',
            'upsertAppearance',
        ];

        foreach ($expected as $name) {
            $tool = self::$catalog->find($name);
            $this->assertNotNull($tool, "Write tool '{$name}' must be present in the catalog.");
            $this->assertSame('write', $tool['safety'], "Tool '{$name}' must have safety=write.");
        }
    }

    public function testAllAdminToolsArePresent(): void
    {
        $expected = [
            'createActionCredential',
            'updateActionCredential',
        ];

        foreach ($expected as $name) {
            $tool = self::$catalog->find($name);
            $this->assertNotNull($tool, "Admin tool '{$name}' must be present in the catalog.");
            $this->assertSame('admin', $tool['safety'], "Tool '{$name}' must have safety=admin.");
        }
    }

    public function testAllDestructiveToolsArePresent(): void
    {
        $expected = [
            'deleteScenario',
            'deleteActionCredential',
            'deleteOrganization',
        ];

        foreach ($expected as $name) {
            $tool = self::$catalog->find($name);
            $this->assertNotNull($tool, "Destructive tool '{$name}' must be present in the catalog.");
            $this->assertSame('destructive', $tool['safety'], "Tool '{$name}' must have safety=destructive.");
        }
    }

    // ── Safety level counts ───────────────────────────────────────────────────

    public function testReadToolsOutnumberWriteAndDestructiveTools(): void
    {
        $counts = ['read' => 0, 'write' => 0, 'admin' => 0, 'destructive' => 0];

        foreach (self::$catalog->tools() as $tool) {
            $level = $tool['safety'];

            if (isset($counts[$level])) {
                ++$counts[$level];
            }
        }

        $this->assertGreaterThan(0, $counts['read'], 'Must have at least one read tool.');
        $this->assertGreaterThanOrEqual($counts['destructive'], $counts['read'], 'Read tools should outnumber destructive tools.');
    }

    // ── Key tool content ──────────────────────────────────────────────────────

    public function testGetHealthToolIsCorrect(): void
    {
        $tool = self::$catalog->find('getHealth');

        $this->assertNotNull($tool);
        $this->assertSame('GET', $tool['source']['method']);
        $this->assertSame('/health', $tool['source']['path']);
        $this->assertSame('getHealth', $tool['source']['operationId']);
        $this->assertSame('#/components/schemas/HealthResponse', $tool['responseSchemaRef']);
    }

    public function testGetScenarioAnalyticsToolHasPeriodAndIdParams(): void
    {
        $tool = self::$catalog->find('getScenarioAnalytics');

        $this->assertNotNull($tool);
        $this->assertSame('GET', $tool['source']['method']);
        $this->assertSame('/api/v1/scenarios/{id}/analytics', $tool['source']['path']);

        $props = $tool['inputSchema']['properties'] ?? [];
        $this->assertArrayHasKey('id', $props, 'inputSchema must have id property.');
        $this->assertArrayHasKey('period', $props, 'inputSchema must have period property.');
        $this->assertSame('integer', $props['id']['type']);
    }

    public function testUpdateScenarioToolRequiresIdAndAllowsNodes(): void
    {
        $tool = self::$catalog->find('updateScenario');

        $this->assertNotNull($tool);
        $this->assertSame('PATCH', $tool['source']['method']);
        $this->assertContains('id', $tool['inputSchema']['required'] ?? []);

        $props = $tool['inputSchema']['properties'] ?? [];
        $this->assertArrayHasKey('nodes', $props, 'updateScenario must expose nodes param.');
        $this->assertArrayHasKey('edges', $props, 'updateScenario must expose edges param.');
        $this->assertArrayHasKey('status', $props, 'updateScenario must expose status param.');
    }

    public function testDestructiveToolsHaveNullResponseSchemaRef(): void
    {
        foreach (self::$catalog->tools() as $tool) {
            if ($tool['safety'] === 'destructive') {
                $this->assertNull(
                    $tool['responseSchemaRef'],
                    "Destructive tool '{$tool['name']}' should have null responseSchemaRef.",
                );
            }
        }
    }

    public function testAllToolNamesAreUnique(): void
    {
        $names = array_column(self::$catalog->tools(), 'name');
        $unique = array_unique($names);

        $this->assertCount(count($unique), $names, 'All tool names in the catalog must be unique.');
    }

    public function testAllToolSourceMethodsAreUppercase(): void
    {
        foreach (self::$catalog->tools() as $tool) {
            $method = $tool['source']['method'];
            $this->assertSame(
                strtoupper($method),
                $method,
                "Tool '{$tool['name']}' source.method must be uppercase.",
            );
        }
    }
}
