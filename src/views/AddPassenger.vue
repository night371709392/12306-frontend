<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <router-link to="/passenger" class="back-link">← 返回</router-link>
        <h2>{{ isEdit ? '编辑乘车人' : '添加乘车人' }}</h2>
      </div>

      <form @submit.prevent="handleSubmit" class="form-card card">
        <div class="field">
          <label class="field__label">真实姓名</label>
          <input v-model="form.realName" :disabled="isEdit" placeholder="请输入姓名" />
        </div>
        <div class="field">
          <label class="field__label">证件类型</label>
          <select v-model="form.idType" :disabled="isEdit" class="full-input">
            <option :value="0">居民身份证</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">证件号码</label>
          <input v-model="form.idCard" :disabled="isEdit" placeholder="18位身份证号" />
        </div>
        <div class="field">
          <label class="field__label">手机号</label>
          <input v-model="form.phone" placeholder="11位手机号" />
        </div>
        <div class="field">
          <label class="field__label">旅客类型</label>
          <select v-model="form.discountType" class="full-input">
            <option :value="0">成人</option>
            <option :value="1">儿童</option>
            <option :value="2">学生</option>
            <option :value="3">残疾军人</option>
          </select>
        </div>

        <p v-if="errorMsg" class="err-msg">{{ errorMsg }}</p>
        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? '提交中…' : (isEdit ? '保存修改' : '添加乘车人') }}
        </button>
      </form>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { addPassenger, updatePassenger, getPassengerList } from '@/api'

const route = useRoute()
const router = useRouter()
const isEdit = route.query.type === 'edit'
const submitting = ref(false)
const errorMsg = ref('')

const form = reactive({
  realName: '',
  idType: 0,
  idCard: '',
  phone: '',
  discountType: 0
})

onMounted(async () => {
  if (isEdit && route.query.id) {
    try {
      const res = await getPassengerList()
      if (res.success) {
        const p = (res.data || []).find(p => String(p.id) === String(route.query.id))
        if (p) {
          form.realName = p.realName
          form.idType = p.idType
          form.idCard = p.idCard?.replace(/\*/g, '') || '' // original ID needed for edit
          form.phone = p.phone?.replace(/\*/g, '') || ''
          form.discountType = p.discountType
        }
      }
    } catch {}
  }
})

async function handleSubmit() {
  errorMsg.value = ''
  if (!form.realName || !form.idCard || !form.phone) {
    errorMsg.value = '请填写完整信息'
    return
  }
  submitting.value = true
  try {
    const data = { ...form }
    if (isEdit) data.id = route.query.id
    const api = isEdit ? updatePassenger : addPassenger
    const res = await api(data)
    if (res.success) {
      router.push('/passenger')
    } else {
      errorMsg.value = res.message || '操作失败'
    }
  } catch {
    errorMsg.value = '网络错误'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: var(--s-md); margin-bottom: var(--s-lg); }
.page-header h2 { font-size: 1.1rem; }
.back-link { font-size: 0.8rem; color: var(--c-text-dim); }
.back-link:hover { color: var(--c-white); }
.form-card { max-width: 480px; padding: var(--s-lg); display: flex; flex-direction: column; gap: var(--s-md); }
.field__label { display: block; font-size: 0.68rem; color: var(--c-text-muted); margin-bottom: var(--s-xs); letter-spacing: 0.03em; }
.field input, .field select { width: 100%; }
.full-input { width: 100%; padding: 10px 14px; }
.submit-btn { padding: 12px; background: var(--c-white); color: var(--c-bg); border: none; border-radius: var(--r-md); font-size: 0.9rem; font-weight: 600; cursor: pointer; letter-spacing: 0.04em; }
.submit-btn:hover { opacity: 0.85; }
.submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.err-msg { color: var(--c-err); font-size: 0.8rem; text-align: center; }
</style>
