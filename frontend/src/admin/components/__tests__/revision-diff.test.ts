import { describe, it, expect } from 'vitest'
import { diffNodes, diffEdges } from '../RevisionDiffPanel.js'
import type {
    ScenarioRevisionSnapshotNode,
    ScenarioRevisionSnapshotEdge,
} from '../../api.js'

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function node(
    id: string,
    overrides: Partial<ScenarioRevisionSnapshotNode> = {},
): ScenarioRevisionSnapshotNode {
    return {
        node_id:    id,
        type:       'message',
        label:      `Label ${id}`,
        data:       {},
        position_x: 0,
        position_y: 0,
        ...overrides,
    }
}

function edge(
    src: string,
    tgt: string,
    label: string | null = null,
): ScenarioRevisionSnapshotEdge {
    return { source_node_id: src, target_node_id: tgt, label }
}

// ── diffNodes ─────────────────────────────────────────────────────────────────

describe('diffNodes', () => {
    it('空配列同士は変更なし', () => {
        const result = diffNodes([], [])
        expect(result.added).toHaveLength(0)
        expect(result.removed).toHaveLength(0)
        expect(result.modified).toHaveLength(0)
    })

    it('before が空 → after のノードが全て added', () => {
        const result = diffNodes([], [node('n1'), node('n2')])
        expect(result.added).toHaveLength(2)
        expect(result.removed).toHaveLength(0)
        expect(result.modified).toHaveLength(0)
    })

    it('after が空 → before のノードが全て removed', () => {
        const result = diffNodes([node('n1'), node('n2')], [])
        expect(result.added).toHaveLength(0)
        expect(result.removed).toHaveLength(2)
        expect(result.modified).toHaveLength(0)
    })

    it('同一ノードは変更なし', () => {
        const n = node('n1')
        const result = diffNodes([n], [n])
        expect(result.added).toHaveLength(0)
        expect(result.removed).toHaveLength(0)
        expect(result.modified).toHaveLength(0)
    })

    // ── フィールド変更検出 ────────────────────────────────────────────────────

    it('label 変更を検出する', () => {
        const before = node('n1', { label: 'Old' })
        const after  = node('n1', { label: 'New' })
        const result = diffNodes([before], [after])
        expect(result.modified).toHaveLength(1)
        expect(result.modified[0].changes).toContain('label')
    })

    it('type 変更を検出する', () => {
        const before = node('n1', { type: 'message' })
        const after  = node('n1', { type: 'end' })
        const result = diffNodes([before], [after])
        expect(result.modified[0].changes).toContain('type')
    })

    it('data 変更を検出する', () => {
        const before = node('n1', { data: { text: 'A' } })
        const after  = node('n1', { data: { text: 'B' } })
        const result = diffNodes([before], [after])
        expect(result.modified[0].changes).toContain('data')
    })

    it('data が {} から {} は変更なし', () => {
        const before = node('n1', { data: {} })
        const after  = node('n1', { data: {} })
        const result = diffNodes([before], [after])
        expect(result.modified).toHaveLength(0)
    })

    // ── 位置変更の tolerance ─────────────────────────────────────────────────

    it('位置差 0.5 以下は変更なし (tolerance 境界)', () => {
        const before = node('n1', { position_x: 0,   position_y: 0   })
        const after  = node('n1', { position_x: 0.5, position_y: 0.5 })
        const result = diffNodes([before], [after])
        expect(result.modified).toHaveLength(0)
    })

    it('位置差が 0.5 を超えると position 変更を検出', () => {
        const before = node('n1', { position_x: 0,    position_y: 0 })
        const after  = node('n1', { position_x: 0.51, position_y: 0 })
        const result = diffNodes([before], [after])
        expect(result.modified[0].changes).toContain('position')
    })

    it('x と y 両方 0.5 を超えると position 変更を検出', () => {
        const before = node('n1', { position_x: 0,  position_y: 0  })
        const after  = node('n1', { position_x: 1,  position_y: 1  })
        const result = diffNodes([before], [after])
        expect(result.modified[0].changes).toContain('position')
    })

    it('x のみ 0.5 超えても position 変更を検出', () => {
        const before = node('n1', { position_x: 0,   position_y: 0 })
        const after  = node('n1', { position_x: 100, position_y: 0 })
        const result = diffNodes([before], [after])
        expect(result.modified[0].changes).toContain('position')
    })

    // ── 複合変更 ─────────────────────────────────────────────────────────────

    it('複数フィールドが同時変更されると全て記録', () => {
        const before = node('n1', { label: 'A', type: 'message' })
        const after  = node('n1', { label: 'B', type: 'end'     })
        const result = diffNodes([before], [after])
        expect(result.modified[0].changes).toContain('label')
        expect(result.modified[0].changes).toContain('type')
    })

    it('before/after の参照が correct に記録される', () => {
        const before = node('n1', { label: 'Old' })
        const after  = node('n1', { label: 'New' })
        const result = diffNodes([before], [after])
        expect(result.modified[0].before.label).toBe('Old')
        expect(result.modified[0].after.label).toBe('New')
    })

    // ── 複数ノード混在 ────────────────────────────────────────────────────────

    it('追加・削除・変更が混在する場合を正確に分類', () => {
        const shared1 = node('shared1')
        const modified = node('mod', { label: 'Before' })
        const modifiedAfter = node('mod', { label: 'After' })
        const toRemove = node('removed')
        const toAdd = node('added')

        const result = diffNodes(
            [shared1, modified, toRemove],
            [shared1, modifiedAfter, toAdd],
        )

        expect(result.added.map(n => n.node_id)).toContain('added')
        expect(result.removed.map(n => n.node_id)).toContain('removed')
        expect(result.modified.map(m => m.after.node_id)).toContain('mod')
        expect(result.added).toHaveLength(1)
        expect(result.removed).toHaveLength(1)
        expect(result.modified).toHaveLength(1)
    })
})

// ── diffEdges ─────────────────────────────────────────────────────────────────

describe('diffEdges', () => {
    it('空配列同士は変更なし', () => {
        const result = diffEdges([], [])
        expect(result.added).toHaveLength(0)
        expect(result.removed).toHaveLength(0)
    })

    it('before が空 → after のエッジが全て added', () => {
        const result = diffEdges([], [edge('n1', 'n2'), edge('n2', 'n3')])
        expect(result.added).toHaveLength(2)
        expect(result.removed).toHaveLength(0)
    })

    it('after が空 → before のエッジが全て removed', () => {
        const result = diffEdges([edge('n1', 'n2')], [])
        expect(result.added).toHaveLength(0)
        expect(result.removed).toHaveLength(1)
    })

    it('同一エッジは変更なし', () => {
        const e = edge('n1', 'n2', 'yes')
        const result = diffEdges([e], [e])
        expect(result.added).toHaveLength(0)
        expect(result.removed).toHaveLength(0)
    })

    it('ラベルが異なるエッジは別物として扱う', () => {
        // n1→n2 label=null と n1→n2 label='yes' は異なる
        const before = [edge('n1', 'n2', null)]
        const after  = [edge('n1', 'n2', 'yes')]
        const result = diffEdges(before, after)
        expect(result.added).toHaveLength(1)
        expect(result.removed).toHaveLength(1)
    })

    it('エッジの追加と削除が混在する場合', () => {
        const e1 = edge('a', 'b')
        const e2 = edge('b', 'c')
        const e3 = edge('c', 'd')

        const result = diffEdges([e1, e2], [e2, e3])
        expect(result.added.map(e => e.target_node_id)).toContain('d')
        expect(result.removed.map(e => e.source_node_id)).toContain('a')
        expect(result.added).toHaveLength(1)
        expect(result.removed).toHaveLength(1)
    })

    it('null ラベルのエッジキーが正しく生成される', () => {
        // label=null のエッジは "src→tgt|" というキーになる
        const before = [edge('n1', 'n2', null)]
        const after  = [edge('n1', 'n2', null)]
        const result = diffEdges(before, after)
        expect(result.added).toHaveLength(0)
        expect(result.removed).toHaveLength(0)
    })
})
