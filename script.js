// ================= STATE =================
const state = JSON.parse(localStorage.getItem("rpg")) || {
  level: 1,
  xp: 0,
  mana: 100,
  maxMana: 100,
  gold: 0,
  class: "Aprendiz do Conhecimento",
  inventory: {
    manaPotion: 2,
    xpScroll: 1,
  },
  log: [],
  quests: [
    { id: 1, text: "Estudar 25 min", done: false },
    { id: 2, text: "Completar 2 sessões", done: false },
    { id: 3, text: "Passar de 1h hoje", done: false },
  ],
  sessions: 0,
  minutes: 0,
  skillBuff: null,
}

// ================= CONFIG =================
const classBonus = {
  Curandeiro: { xp: 1.2, skill: "Regeneração" },
  Estrategista: { xp: 1.4, skill: "Plano Mestre" },
  Executor: { xp: 1.6, skill: "Ataque Focado" },
  "Aprendiz do Conhecimento": { xp: 1, skill: "Aprendizado Básico" },
}

const skillsDesc = {
  Regeneração: "Recupera foco: +30 XP 💚",
  "Plano Mestre": "Dobra XP da próxima sessão 🧠",
  "Ataque Focado": "+50 XP instantâneo ⚔️",
  "Aprendizado Básico": "+10 XP",
}

const skillCost = {
  Regeneração: 20,
  "Plano Mestre": 30,
  "Ataque Focado": 40,
  "Aprendizado Básico": 10,
}

// ================= NPC =================
const npcLines = [
  "💰 XP bem gasto rende poder.",
  "📚 Conhecimento também é moeda.",
  "⚔️ Um bom estudo vale mais que mil batalhas.",
  "🧠 Volte sempre que precisar evoluir.",
  "✨ Itens raros aparecem com o tempo...",
]

const npcBuyLines = [
  "🧾 Excelente escolha!",
  "😏 Bom investimento.",
  "📦 Negócio fechado!",
  "✨ Use com sabedoria.",
  "⚔️ Isso vai te ajudar.",
]

function updateNPC(mode = "idle") {
  const el = document.getElementById("npcTalk")
  if (!el) return
  const source = mode === "buy" ? npcBuyLines : npcLines
  el.textContent = `"${source[Math.floor(Math.random() * source.length)]}"`
}

// ================= CORE =================
function save() {
  localStorage.setItem("rpg", JSON.stringify(state))
}

function gainXP(amount) {
  const bonus = classBonus[state.class]?.xp || 1
  state.xp += Math.floor(amount * bonus)

  while (state.xp >= 100) {
    state.xp -= 100
    state.level++
    state.log.unshift(`🔺 Subiu para o nível ${state.level}`)
  }
}

function checkQuests() {
  state.quests.forEach((q) => {
    if (q.id === 1 && state.minutes >= 25) q.done = true
    if (q.id === 2 && state.sessions >= 2) q.done = true
    if (q.id === 3 && state.minutes >= 60) q.done = true
  })
}

// ================= ACTIONS =================
function study(min) {
  state.sessions++
  state.minutes += min

  let bonus = 1
  if (state.skillBuff) {
    bonus = state.skillBuff
    state.skillBuff = null
    state.log.unshift("✨ Skill consumida")
  }

  gainXP(min * bonus)
  state.mana = Math.min(state.maxMana, state.mana + 10)

  state.log.unshift(`📚 Estudo de ${min} min (+XP, +10 mana)`)
  checkQuests()
  save()
  render()
}

function setClass(c) {
  state.class = c
  state.log.unshift(`🎭 Classe escolhida: ${c}`)
  save()
  render()
}

function useSkill() {
  const skill = classBonus[state.class].skill
  const cost = skillCost[skill]

  if (state.mana < cost) {
    state.log.unshift("🔵 Mana insuficiente")
    save()
    render()
    return
  }

  state.mana -= cost

  if (skill === "Regeneração") gainXP(30)
  if (skill === "Plano Mestre") state.skillBuff = 2
  if (skill === "Ataque Focado") gainXP(50)
  if (skill === "Aprendizado Básico") gainXP(10)

  state.log.unshift(`✨ Skill usada: ${skill} (-${cost} mana)`)
  save()
  render()
}

function usePotion(type) {
  if (type === "mana" && state.inventory.manaPotion > 0) {
    state.inventory.manaPotion--
    state.mana = Math.min(state.maxMana, state.mana + 40)
    state.log.unshift("🔵 Poção de Mana usada")
  } else if (type === "xp" && state.inventory.xpScroll > 0) {
    state.inventory.xpScroll--
    gainXP(40)
    state.log.unshift("📜 Pergaminho de XP usado")
  } else {
    state.log.unshift("❌ Item indisponível")
  }

  save()
  render()
}

function buyItem(type) {
  const prices = { mana: 30, xp: 50 }

  if (state.xp < prices[type]) {
    state.log.unshift("❌ XP insuficiente")
    save()
    render()
    return
  }

  state.xp -= prices[type]
  if (type === "mana") state.inventory.manaPotion++
  if (type === "xp") state.inventory.xpScroll++

  state.log.unshift("🛒 Item comprado")
  updateNPC("buy")
  save()
  render()
}

// ================= RENDER =================
function render() {
  updateNPC()

  className.textContent = state.class
  level.textContent = state.level
  xp.textContent = state.xp
  xpBar.style.width = (state.xp / 100) * 100 + "%"
  manaBar.style.width = (state.mana / state.maxMana) * 100 + "%"
  manaText.textContent = state.mana

  const q = document.getElementById("quests")
  q.innerHTML = ""
  state.quests.forEach((qu) => {
    const d = document.createElement("div")
    d.className = "quest" + (qu.done ? " done" : "")
    d.innerHTML = `<span>${qu.text}</span><span>${qu.done ? "✅" : "⏳"}</span>`
    q.appendChild(d)
  })

  inventory.innerHTML = `
    <div class="quest">🔵 Poção de Mana: ${state.inventory.manaPotion}</div>
    <div class="quest">📜 Pergaminho XP: ${state.inventory.xpScroll}</div>
  `

  log.innerHTML = state.log.map((l) => `• ${l}`).join("<br>")
}

render()
