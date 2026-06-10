<template>
  <AppLayout>
    <div class="page">
      <h2>账户信息</h2>

      <div v-if="loading" class="loading">加载中…</div>

      <template v-if="user && !loading">
        <!-- Read-only -->
        <div class="card section">
          <h3 class="section-label">基本信息</h3>
          <div class="info-grid">
            <div class="info-grid__item">
              <span class="dim" style="font-size:0.68rem">用户名</span>
              <span class="mono">{{ user.username }}</span>
            </div>
            <div class="info-grid__item">
              <span class="dim" style="font-size:0.68rem">姓名</span>
              <span>{{ user.realName }}</span>
            </div>
            <div class="info-grid__item">
              <span class="dim" style="font-size:0.68rem">证件类型</span>
              <span>居民身份证</span>
            </div>
            <div class="info-grid__item">
              <span class="dim" style="font-size:0.68rem">证件号码</span>
              <span class="mono">{{ user.idCard }}</span>
            </div>
            <div class="info-grid__item">
              <span class="dim" style="font-size:0.68rem">用户类型</span>
              <span :class="['type-badge', typeClass(user.userType)]">{{ typeMap[user.userType] || user.userType }}</span>
            </div>
          </div>
        </div>

        <!-- Editable: contact -->
        <div class="card section">
          <div class="section-header">
            <h3 class="section-label">联系方式</h3>
            <button class="edit-toggle" @click="editing = !editing">{{ editing ? '取消' : '编辑' }}</button>
          </div>
          <form v-if="editing" @submit.prevent="saveContact" class="edit-form">
            <div class="field">
              <label class="field__label">手机号</label>
              <input :value="user.phone" disabled class="dim" />
            </div>
            <div class="field">
              <label class="field__label">邮箱</label>
              <input v-model="editForm.mail" type="email" placeholder="邮箱" />
            </div>
            <div class="field">
              <label class="field__label">地址</label>
              <input v-model="editForm.address" placeholder="地址" />
            </div>
            <div class="field">
              <label class="field__label">邮编</label>
              <input v-model="editForm.postCode" placeholder="邮编" />
            </div>
            <button type="submit" class="save-btn" :disabled="saving">保存</button>
            <p v-if="saveMsg" :class="saveOk ? 'ok-msg' : 'err-msg'">{{ saveMsg }}</p>
          </form>
          <div v-else class="info-grid">
            <div class="info-grid__item">
              <span class="dim" style="font-size:0.68rem">手机号</span>
              <span class="mono">{{ user.phone }}</span>
            </div>
            <div class="info-grid__item">
              <span class="dim" style="font-size:0.68rem">邮箱</span>
              <span>{{ user.mail || '未设置' }}</span>
            </div>
            <div class="info-grid__item">
              <span class="dim" style="font-size:0.68rem">地址</span>
              <span>{{ user.address || '未设置' }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { getUserInfo, updateUser } from '@/api'

const user = ref(null)
const loading = ref(true)
const editing = ref(false)
const saving = ref(false)
const saveMsg = ref('')
const saveOk = ref(false)
const typeMap = { 0:'成人', 1:'儿童', 2:'学生', 3:'残疾军人' }
function typeClass(t) {
  if (t === 1) return 'type-badge--blue'
  if (t === 2) return 'type-badge--green'
  if (t === 3) return 'type-badge--amber'
  return 'type-badge--slate'
}

const editForm = reactive({ mail: '', address: '', postCode: '' })

onMounted(async () => {
  const username = sessionStorage.getItem('username')
  if (!username) { loading.value = false; return }
  try {
    const res = await getUserInfo({ username })
    if (res.success && res.data) {
      user.value = res.data
      editForm.mail = res.data.mail || ''
      editForm.address = res.data.address || ''
      editForm.postCode = res.data.postCode || ''
    }
  } catch {} finally { loading.value = false }
})

async function saveContact() {
  saving.value = true; saveMsg.value = ''
  try {
    const res = await updateUser({
      username: user.value.username,
      mail: editForm.mail,
      address: editForm.address,
      postCode: editForm.postCode
    })
    if (res.success) {
      user.value.mail = editForm.mail
      user.value.address = editForm.address
      user.value.postCode = editForm.postCode
      editing.value = false
      saveMsg.value = '保存成功'
      saveOk.value = true
    } else {
      saveMsg.value = res.message || '保存失败'
      saveOk.value = false
    }
  } catch { saveMsg.value = '网络错误'; saveOk.value = false
  } finally { saving.value = false }
}
</script>

<style scoped>
h2 { margin-bottom: var(--s-lg); }
.loading { text-align: center; padding: var(--s-3xl); color: var(--c-text-muted); }
.section { margin-bottom: var(--s-md); padding: var(--s-lg); }
.section-label { font-size: 0.72rem; color: var(--c-text-muted); margin-bottom: var(--s-md); letter-spacing: 0.04em; text-transform: uppercase; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--s-md); }
.edit-toggle { background: none; border: 1px solid var(--c-border); color: var(--c-text-dim); padding: 4px 14px; border-radius: var(--r-sm); font-size: 0.72rem; cursor: pointer; }
.edit-toggle:hover { color: var(--c-white); border-color: var(--c-border-lt); }
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--s-md); }
.info-grid__item { display: flex; flex-direction: column; gap: 2px; }
.edit-form { display: flex; flex-direction: column; gap: var(--s-md); }
.field__label { display: block; font-size: 0.68rem; color: var(--c-text-muted); margin-bottom: var(--s-xs); letter-spacing: 0.03em; }
.field input { width: 100%; }
.save-btn { padding: 10px var(--s-xl); background: var(--c-white); color: var(--c-bg); border: none; border-radius: var(--r-md); font-size: 0.85rem; font-weight: 600; cursor: pointer; align-self: flex-start; }
.save-btn:hover { opacity: 0.85; }
.save-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.ok-msg { color: var(--c-ok); font-size: 0.8rem; }
.err-msg { color: var(--c-err); font-size: 0.8rem; }

.type-badge { padding: 2px 10px; border-radius: var(--r-sm); font-size: 0.75rem; font-weight: 500; display: inline-block; }
.type-badge--slate { background: var(--c-slate-bg); color: var(--c-slate); }
.type-badge--blue  { background: var(--c-blue-bg);  color: var(--c-blue); }
.type-badge--green { background: var(--c-green-bg); color: var(--c-green); }
.type-badge--amber { background: var(--c-amber-bg); color: var(--c-amber); }
</style>
