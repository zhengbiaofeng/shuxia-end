<template>
  <section class="resource-table-card">
    <div class="table-wrap">
      <table class="storage-table">
        <thead>
          <tr>
            <th>存储名称</th>
            <th>类型</th>
            <th>路径 / 地址</th>
            <th>总容量</th>
            <th>已使用</th>
            <th>可用空间</th>
            <th>状态</th>
            <th>最后扫描</th>
            <th>文件数</th>
            <th v-if="canManageStorage">操作</th>
          </tr>
        </thead>
        <tbody v-if="rows.length">
          <tr v-for="row in rows" :key="row.id || row.name">
            <td>
              <div class="storage-name">
                <span class="storage-name__icon" :class="`tone-${row.color}`">
                  <el-icon><FolderOpened /></el-icon>
                </span>
                <div>
                  <strong>{{ row.name }}</strong>
                  <span>{{ row.desc }}</span>
                </div>
              </div>
            </td>
            <td><span class="type-chip" :class="typeTone(row.type)">{{ row.type }}</span></td>
            <td>
              <div class="path-cell" :title="row.path">
                <strong>{{ row.path }}</strong>
                <span v-if="row.volume">{{ row.volume }}</span>
              </div>
            </td>
            <td>
              <span v-if="row.capacityKnown">{{ row.total }}</span>
              <el-tooltip v-else :content="row.capacityNote || '当前存储源无法获取物理盘容量'" placement="top">
                <span class="capacity-unknown">容量未知</span>
              </el-tooltip>
            </td>
            <td>
              <div v-if="row.capacityKnown" class="usage-cell">
                <span>{{ row.used }}</span>
                <div><i :style="{ width: `${row.percent}%` }" /></div>
              </div>
              <span v-else>--</span>
            </td>
            <td>{{ row.free }}</td>
            <td>
              <el-tooltip :content="row.capacityNote || row.status" placement="top">
                <span class="status-dot" :class="`is-${row.statusTone}`"><i />{{ row.status }}</span>
              </el-tooltip>
            </td>
            <td><span class="scan-cell"><el-icon><VideoPlay /></el-icon>{{ row.scan }}</span></td>
            <td>{{ row.files }}</td>
            <td v-if="canManageStorage">
              <div class="table-actions">
                <el-tooltip v-if="authStore.hasPermission('sxbook:book:add')" content="扫描目录" placement="top">
                  <button
                    type="button"
                    :disabled="!row.scannable || scanningId === row.id"
                    @click="$emit('scan', row)"
                  >
                    <el-icon><Loading v-if="scanningId === row.id" /><VideoPlay v-else /></el-icon>
                  </button>
                </el-tooltip>
                <el-tooltip v-if="authStore.hasPermission('sxbook:storage:source:edit')" content="编辑" placement="top">
                  <button type="button" @click="$emit('edit', row)"><el-icon><EditPen /></el-icon></button>
                </el-tooltip>
                <el-tooltip v-if="authStore.hasPermission('sxbook:storage:source:delete')" content="删除" placement="top">
                  <button type="button" class="danger" @click="$emit('delete', row)"><el-icon><Delete /></el-icon></button>
                </el-tooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!rows.length" class="table-empty">
        <strong>暂无存储源</strong>
        <span>当前接口没有返回存储源数据</span>
      </div>
    </div>

    <ResourcePagination :total="total || rows.length" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Delete, EditPen, FolderOpened, Loading, VideoPlay } from '@element-plus/icons-vue'
import ResourcePagination from './ResourcePagination.vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const canManageStorage = computed(() => authStore.hasAnyPermission([
  'sxbook:book:add',
  'sxbook:storage:source:edit',
  'sxbook:storage:source:delete',
]))

defineProps({
  rows: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  scanningId: { type: String, default: '' },
})

defineEmits(['delete', 'edit', 'scan'])

function typeTone(type) {
  if (type === 'SMB') return 'green'
  if (type === 'WebDAV') return 'purple'
  if (type === '网盘') return 'orange'
  return 'blue'
}
</script>

<style scoped>
.resource-table-card {
  margin-top: 22px;
  overflow: hidden;
  border: 1px solid #e7ecf7;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(35, 56, 118, 0.055);
}

.table-wrap {
  overflow-x: auto;
}

.table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 180px;
  gap: 8px;
  border-top: 1px solid #e9eef8;
  color: #50669c;
}

.table-empty strong {
  color: #102557;
  font-size: 15px;
  font-weight: 800;
}

.table-empty span {
  font-size: 13px;
}

.storage-table {
  width: 100%;
  min-width: 1210px;
  border-collapse: collapse;
}

.storage-table th {
  padding: 15px 20px;
  background: #fbfcff;
  color: #102557;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

.storage-table td {
  height: 72px;
  padding: 10px 20px;
  border-top: 1px solid #e9eef8;
  color: #41558a;
  font-size: 13px;
  white-space: nowrap;
}

.path-cell {
  width: min(280px, 20vw);
  min-width: 170px;
}

.path-cell strong,
.path-cell span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.path-cell strong {
  color: #324a82;
  font-weight: 600;
}

.path-cell span {
  margin-top: 4px;
  color: #8290ad;
  font-size: 11px;
}

.capacity-unknown {
  color: #8290ad;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  cursor: help;
}

.storage-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.storage-name__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  font-size: 18px;
}

.storage-name strong {
  display: block;
  color: #102557;
  font-size: 14px;
  font-weight: 800;
}

.storage-name span:not(.storage-name__icon) {
  display: block;
  margin-top: 3px;
  color: #617098;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  height: 25px;
  padding: 0 8px;
  border-radius: 5px;
  font-weight: 700;
}

.type-chip.blue { border: 1px solid #bfdbfe; background: #eff6ff; color: #1476ff; }
.type-chip.green { border: 1px solid #bbf7d0; background: #ecfdf5; color: #16a34a; }
.type-chip.purple { border: 1px solid #ddd6fe; background: #f5f3ff; color: #7c3aed; }
.type-chip.orange { border: 1px solid #fed7aa; background: #fff7ed; color: #f97316; }

.usage-cell {
  width: 140px;
}

.usage-cell div {
  width: 100px;
  height: 4px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #e8eef8;
}

.usage-cell i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #1476ff;
}

.status-dot,
.scan-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  color: #16a34a;
  font-weight: 700;
}

.status-dot.is-warning {
  color: #f97316;
}

.status-dot.is-muted {
  color: #8290ad;
}

.status-dot i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.scan-cell .el-icon {
  color: #1476ff;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #40558f;
  cursor: pointer;
  font-size: 16px;
}

.table-actions button.danger {
  width: 32px;
  height: 32px;
  border: 1px solid #dfe7f5;
  border-radius: 6px;
}

.table-actions button.danger:hover {
  border-color: #fecdd3;
  background: #fff1f2;
  color: #e11d48;
}

.table-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.tone-blue { background: #eff6ff; color: #1476ff; }
.tone-green { background: #ecfdf5; color: #16a34a; }
.tone-purple { background: #f5f3ff; color: #7c3aed; }
</style>
