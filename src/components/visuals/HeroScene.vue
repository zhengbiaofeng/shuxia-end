<template>
  <ResponsiveStage
    name="hero"
    :base-width="900"
    aspect="9/5"
    :max-width="900"
    class="hero-scene"
  >
    <!-- ===== 背景层：halo + 远景云 ===== -->
    <div class="hero-bg">
      <div class="hero-bg__halo hero-bg__halo--1" />
      <div class="hero-bg__halo hero-bg__halo--2" />
      <div class="hero-bg__cloud hero-bg__cloud--1" />
      <div class="hero-bg__cloud hero-bg__cloud--2" />
      <div class="hero-bg__cloud hero-bg__cloud--3" />
      <div class="hero-bg__cloud hero-bg__cloud--4" />
    </div>

    <!-- ===== 中景：底座 ===== -->
    <div class="hero-podium">
      <div class="hero-podium__shadow" />
      <div class="hero-podium__disk" />
    </div>

    <!-- ===== 前景：耳机 (左) ===== -->
    <div class="hero-entity hero-entity--headphones" aria-hidden="true">
      <svg viewBox="0 0 140 160" fill="none">
        <defs>
          <linearGradient id="hpBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--color-headband-hi)" />
            <stop offset="0.5" stop-color="var(--color-headband)" />
            <stop offset="1" stop-color="var(--color-cushion)" />
          </linearGradient>
          <radialGradient id="hpCushion" cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stop-color="var(--color-cushion-rim)" />
            <stop offset="0.7" stop-color="var(--color-cushion)" />
            <stop offset="1" stop-color="var(--color-book-dark-edge)" />
          </radialGradient>
          <radialGradient id="hpPad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stop-color="var(--color-cushion-pad)" />
            <stop offset="1" stop-color="var(--color-cushion)" />
          </radialGradient>
        </defs>
        <!-- 头梁主体 (弧形) -->
        <path
          d="M 18 78 Q 70 6, 122 78"
          stroke="url(#hpBand)"
          stroke-width="10"
          fill="none"
          stroke-linecap="round"
        />
        <!-- 头梁高光 -->
        <path
          d="M 22 76 Q 70 14, 118 76"
          stroke="rgba(255,255,255,0.35)"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
        <!-- 头梁内侧衬垫 -->
        <path
          d="M 26 80 Q 70 22, 114 80"
          stroke="var(--color-cushion-pad)"
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
          opacity="0.5"
        />
        <!-- 左耳罩外壳 -->
        <ellipse cx="20" cy="100" rx="22" ry="30" fill="url(#hpCushion)" />
        <!-- 左耳罩高光 -->
        <ellipse cx="14" cy="92" rx="9" ry="12" fill="rgba(255,255,255,0.18)" />
        <!-- 左耳罩内衬 -->
        <ellipse cx="20" cy="102" rx="13" ry="20" fill="url(#hpPad)" />
        <!-- 左耳罩内圈 -->
        <ellipse cx="20" cy="102" rx="9" ry="14" fill="var(--color-cushion)" opacity="0.6" />
        <!-- 右耳罩外壳 -->
        <ellipse cx="120" cy="100" rx="22" ry="30" fill="url(#hpCushion)" />
        <!-- 右耳罩高光 -->
        <ellipse cx="114" cy="92" rx="9" ry="12" fill="rgba(255,255,255,0.18)" />
        <!-- 右耳罩内衬 -->
        <ellipse cx="120" cy="102" rx="13" ry="20" fill="url(#hpPad)" />
        <!-- 右耳罩内圈 -->
        <ellipse cx="120" cy="102" rx="9" ry="14" fill="var(--color-cushion)" opacity="0.6" />
        <!-- 左右连接臂 -->
        <rect x="14" y="74" width="12" height="14" rx="3" fill="var(--color-headband)" />
        <rect x="114" y="74" width="12" height="14" rx="3" fill="var(--color-headband)" />
      </svg>
    </div>

    <!-- ===== 前景：书籍组 (中左) ===== -->
    <div class="hero-entity hero-entity--books" aria-hidden="true">
      <!-- 暗色书 (左) -->
      <div class="book book--dark">
        <div class="book__spine" />
        <div class="book__pages" />
        <div class="book__top-cap" />
        <div class="book__lines">
          <span /><span /><span />
        </div>
        <div class="book__highlight" />
      </div>
      <!-- 中间高书：人类简史 -->
      <div class="book book--sapiens">
        <div class="book__spine" />
        <div class="book__pages" />
        <div class="book__top-cap" />
        <div class="book__face">
          <div class="book__title-zh">人类简史</div>
          <div class="book__title-en">Sapiens</div>
          <div class="book__seal" />
        </div>
        <div class="book__highlight" />
      </div>
      <!-- 棕色书 (右) -->
      <div class="book book--brown">
        <div class="book__spine" />
        <div class="book__pages" />
        <div class="book__top-cap" />
        <div class="book__lines">
          <span /><span />
        </div>
        <div class="book__highlight" />
      </div>
    </div>

    <!-- ===== 前景：NAS 服务器 (中右) ===== -->
    <div class="hero-entity hero-entity--nas" aria-hidden="true">
      <svg viewBox="0 0 240 300" fill="none">
        <defs>
          <linearGradient id="nasBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#f1f5f9" />
            <stop offset="0.4" stop-color="var(--color-nas-base-1)" />
            <stop offset="1" stop-color="var(--color-nas-base-2)" />
          </linearGradient>
          <linearGradient id="nasTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="rgba(255,255,255,0.85)" />
            <stop offset="1" stop-color="var(--color-nas-base-2)" />
          </linearGradient>
          <linearGradient id="nasFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="rgba(255,255,255,0.4)" />
            <stop offset="0.5" stop-color="rgba(255,255,255,0)" />
            <stop offset="1" stop-color="rgba(15,23,42,0.06)" />
          </linearGradient>
          <linearGradient id="nasBay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--color-nas-bay-edge)" />
            <stop offset="0.5" stop-color="var(--color-nas-bay)" />
            <stop offset="1" stop-color="var(--color-book-dark-edge)" />
          </linearGradient>
          <linearGradient id="nasSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="rgba(15,23,42,0.15)" />
            <stop offset="0.4" stop-color="rgba(15,23,42,0)" />
            <stop offset="1" stop-color="rgba(15,23,42,0.08)" />
          </linearGradient>
        </defs>

        <!-- 投影 -->
        <ellipse cx="120" cy="288" rx="110" ry="10" fill="rgba(15,23,42,0.18)" />

        <!-- 顶部面板 (轻微上倾的梯形) -->
        <path
          d="M 24 38 L 216 38 L 222 22 L 30 22 Z"
          fill="url(#nasTop)"
          stroke="var(--color-nas-base-3)"
          stroke-width="0.5"
        />

        <!-- 机身主体 -->
        <rect
          x="22" y="38" width="196" height="240"
          rx="6" fill="url(#nasBody)"
          stroke="var(--color-nas-base-3)" stroke-width="0.5"
        />

        <!-- 机身前玻璃感反光 -->
        <rect
          x="22" y="38" width="196" height="240"
          rx="6" fill="url(#nasFront)"
        />

        <!-- 机身左侧暗调 -->
        <rect
          x="22" y="38" width="22" height="240"
          rx="6" fill="url(#nasSide)"
        />

        <!-- 顶部品牌槽 -->
        <rect x="40" y="28" width="60" height="4" rx="1" fill="var(--color-nas-base-3)" opacity="0.5" />
        <circle cx="200" cy="30" r="2" fill="var(--color-nas-bay)" opacity="0.6" />

        <!-- 4 个硬盘仓 -->
        <g>
          <!-- 仓 1 -->
          <rect x="38" y="60" width="36" height="150" rx="3" fill="url(#nasBay)" />
          <rect x="40" y="62" width="32" height="146" rx="2" fill="rgba(255,255,255,0.04)" />
          <rect x="40" y="62" width="32" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
          <line x1="56" y1="74" x2="56" y2="200" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" />
          <!-- 仓 2 -->
          <rect x="80" y="60" width="36" height="150" rx="3" fill="url(#nasBay)" />
          <rect x="82" y="62" width="32" height="146" rx="2" fill="rgba(255,255,255,0.04)" />
          <rect x="82" y="62" width="32" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
          <line x1="98" y1="74" x2="98" y2="200" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" />
          <!-- 仓 3 -->
          <rect x="122" y="60" width="36" height="150" rx="3" fill="url(#nasBay)" />
          <rect x="124" y="62" width="32" height="146" rx="2" fill="rgba(255,255,255,0.04)" />
          <rect x="124" y="62" width="32" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
          <line x1="140" y1="74" x2="140" y2="200" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" />
          <!-- 仓 4 -->
          <rect x="164" y="60" width="36" height="150" rx="3" fill="url(#nasBay)" />
          <rect x="166" y="62" width="32" height="146" rx="2" fill="rgba(255,255,255,0.04)" />
          <rect x="166" y="62" width="32" height="3" rx="1" fill="rgba(255,255,255,0.08)" />
          <line x1="182" y1="74" x2="182" y2="200" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" />
        </g>

        <!-- 指示灯区 -->
        <g>
          <circle cx="42" cy="226" r="2" fill="var(--color-success)" />
          <circle cx="42" cy="226" r="3.5" fill="var(--color-led-glow)" opacity="0.4" />
          <circle cx="52" cy="226" r="2" fill="var(--color-success)" opacity="0.6" />
          <circle cx="62" cy="226" r="2" fill="var(--color-nas-base-3)" opacity="0.7" />
          <circle cx="72" cy="226" r="2" fill="var(--color-nas-base-3)" opacity="0.5" />
        </g>

        <!-- 显示屏 -->
        <rect x="38" y="240" width="80" height="24" rx="2" fill="var(--color-nas-screen)" />
        <rect x="40" y="242" width="76" height="20" rx="1" fill="var(--color-nas-screen-2)" />
        <rect x="44" y="247" width="40" height="2" fill="var(--color-accent)" opacity="0.7" />
        <rect x="44" y="252" width="60" height="1.5" fill="var(--color-text-4)" opacity="0.5" />
        <rect x="44" y="256" width="50" height="1.5" fill="var(--color-text-4)" opacity="0.4" />
        <circle cx="108" cy="252" r="2" fill="var(--color-success)" />

        <!-- 右侧按钮区 -->
        <g>
          <circle cx="138" cy="246" r="3" fill="var(--color-nas-base-2)" stroke="var(--color-nas-base-3)" stroke-width="0.5" />
          <circle cx="152" cy="246" r="3" fill="var(--color-nas-base-2)" stroke="var(--color-nas-base-3)" stroke-width="0.5" />
          <rect x="166" y="240" width="34" height="14" rx="2" fill="var(--color-nas-base-2)" stroke="var(--color-nas-base-3)" stroke-width="0.5" />
          <rect x="168" y="242" width="30" height="10" rx="1" fill="var(--color-nas-screen)" opacity="0.5" />
        </g>

        <!-- 底部品牌 LOGO 区域 -->
        <rect x="100" y="270" width="40" height="3" rx="1" fill="var(--color-nas-base-3)" opacity="0.4" />
      </svg>
    </div>

    <!-- ===== 前景：4 个分类卡 (右上 2x2) ===== -->
    <div class="hero-entity hero-entity--cards" aria-hidden="true">
      <div class="hero-card">
        <div class="hero-card__shadow" />
        <div class="hero-card__icon hero-card__icon--audio">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3a7 7 0 0 0-7 7v4a3 3 0 0 0 3 3h1v-7H6v-0a6 6 0 0 1 12 0v0h-3v7h1a3 3 0 0 0 3-3v-4a7 7 0 0 0-7-7z" />
            <path d="M10 13v6a2 2 0 0 0 4 0v-6h-4z" />
          </svg>
        </div>
        <div class="hero-card__name">有声书</div>
      </div>
      <div class="hero-card">
        <div class="hero-card__shadow" />
        <div class="hero-card__icon hero-card__icon--comic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="1.5" />
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="3" y1="14" x2="21" y2="14" />
          </svg>
        </div>
        <div class="hero-card__name">漫画</div>
      </div>
      <div class="hero-card">
        <div class="hero-card__shadow" />
        <div class="hero-card__icon hero-card__icon--book">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4z" />
            <path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7V4z" opacity="0.7" />
          </svg>
        </div>
        <div class="hero-card__name">书籍</div>
      </div>
      <div class="hero-card">
        <div class="hero-card__shadow" />
        <div class="hero-card__icon hero-card__icon--novel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
            <line x1="8" y1="8" x2="15" y2="8" />
            <line x1="8" y1="12" x2="15" y2="12" />
            <line x1="8" y1="16" x2="12" y2="16" />
          </svg>
        </div>
        <div class="hero-card__name">小说</div>
      </div>
    </div>
  </ResponsiveStage>
</template>

<script setup>
/**
 * HeroScene - Login 视觉场景（高保真重构版）
 *
 * 设计稿基准：900 × 500
 * 换算公式：   px ÷ 900 × 100 = cqw
 *              px ÷ 500 × 100 = cqh
 *
 * 内部使用 ResponsiveStage 包装，所有元素位置/尺寸用 cqw/cqh
 * 自带 SVG 资产、丰富渐变、多层阴影、细节纹理
 */
import { ResponsiveStage } from '../layout'
</script>

<style scoped>
/* ============================================
 *  背景层 (halo + cloud)
 * ============================================ */
.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-bg__halo {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.hero-bg__halo--1 {
  left: 11.11cqw;
  top: 26cqh;
  width: 80cqw;
  height: 50cqh;
  background: radial-gradient(
    ellipse at center,
    var(--color-halo) 0%,
    var(--color-halo-fade) 70%
  );
  animation: haloPulse 6s ease-in-out infinite alternate;
}
.hero-bg__halo--2 {
  left: 35cqw;
  top: 42cqh;
  width: 32cqw;
  height: 22cqh;
  background: radial-gradient(
    ellipse at center,
    rgba(147, 197, 253, 0.35) 0%,
    rgba(147, 197, 253, 0) 70%
  );
}

.hero-bg__cloud {
  position: absolute;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95) 0%,
    var(--color-cloud) 100%
  );
  border-radius: 50%;
  pointer-events: none;
  filter: blur(0.4cqw);
}
.hero-bg__cloud--1 { left: 4.44cqw;  top: 6cqh;  width: 13.33cqw; height: 6cqh;  opacity: 0.7;  animation: cloudDrift 9s ease-in-out infinite alternate; }
.hero-bg__cloud--2 { left: 80cqw;    top: 12cqh; width: 15.56cqw; height: 6.4cqh; opacity: 0.6; animation: cloudDrift 12s ease-in-out infinite alternate-reverse; }
.hero-bg__cloud--3 { left: 1.33cqw;  top: 44cqh; width: 8.89cqw;  height: 4.4cqh; opacity: 0.55; animation: cloudDrift 7s ease-in-out infinite alternate; }
.hero-bg__cloud--4 { left: 88.89cqw; top: 52cqh; width: 9.78cqw;  height: 4.4cqh; opacity: 0.55; animation: cloudDrift 10s ease-in-out infinite alternate-reverse; }

/* ============================================
 *  中景：底座
 * ============================================ */
.hero-podium {
  position: absolute;
  left: 8.89cqw;
  top: 80cqh;
  width: 82.22cqw;
  height: 18cqh;
  pointer-events: none;
}

.hero-podium__shadow {
  position: absolute;
  left: 4cqw;
  top: 0;
  width: 74cqw;
  height: 100%;
  background: radial-gradient(
    ellipse at center,
    rgba(15, 23, 42, 0.22) 0%,
    rgba(15, 23, 42, 0.05) 50%,
    rgba(15, 23, 42, 0) 80%
  );
  border-radius: 50%;
  filter: blur(1.2cqw);
}

.hero-podium__disk {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at center top,
      rgba(255, 255, 255, 0.6) 0%,
      rgba(255, 255, 255, 0) 50%
    ),
    radial-gradient(
      ellipse at center,
      var(--color-podium) 0%,
      var(--color-podium-deep) 70%,
      var(--color-podium-edge) 100%
    );
  border-radius: 50%;
  box-shadow:
    inset 0 0.5cqh 1.2cqh rgba(255, 255, 255, 0.5),
    inset 0 -0.6cqh 1.2cqh rgba(15, 23, 42, 0.08);
  opacity: 0.85;
}

/* ============================================
 *  通用 entity 容器
 * ============================================ */
.hero-entity {
  position: absolute;
}

/* ============================================
 *  耳机
 * ============================================ */
.hero-entity--headphones {
  left: 5cqw;
  top: 38cqh;
  width: 15cqw;
  height: 36cqh;
  filter: drop-shadow(0 0.6cqh 0.6cqh rgba(15, 23, 42, 0.18));
}
.hero-entity--headphones svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* ============================================
 *  书籍组
 * ============================================ */
.hero-entity--books {
  left: 19cqw;
  top: 22cqh;
  width: 32cqw;
  height: 62cqh;
  display: flex;
  align-items: flex-end;
  gap: 0.8cqw;
}

.book {
  position: relative;
  border-radius: 0.5cqw;
  box-shadow:
    0 1.2cqh 1.6cqh rgba(15, 23, 42, 0.18),
    0 0.3cqh 0.6cqh rgba(15, 23, 42, 0.12);
  overflow: visible;
}

/* 通用：书脊阴影（左/右边缘） */
.book__spine {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 0.55cqw;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0) 100%
  );
  border-radius: 0.5cqw 0 0 0.5cqw;
}

/* 通用：页面边缘（右侧） */
.book__pages {
  position: absolute;
  top: 0.25cqh;
  right: 0;
  bottom: 0.25cqh;
  width: 0.4cqw;
  background: linear-gradient(
    90deg,
    var(--color-book-page-2) 0%,
    var(--color-book-page) 60%,
    rgba(255, 255, 255, 0.95) 100%
  );
  border-radius: 0 0.4cqw 0.4cqw 0;
  box-shadow: inset -0.05cqw 0 0 rgba(15, 23, 42, 0.08);
}

/* 通用：顶部书页俯视 */
.book__top-cap {
  position: absolute;
  top: 0;
  left: 0.4cqw;
  right: 0.2cqw;
  height: 0.4cqh;
  background: linear-gradient(
    180deg,
    var(--color-book-page) 0%,
    var(--color-book-page-2) 100%
  );
  border-radius: 0.3cqw 0.3cqw 0 0;
}

/* 通用：封面高光（左上 → 右下渐变） */
.book__highlight {
  position: absolute;
  inset: 0;
  border-radius: 0.5cqw;
  background: linear-gradient(
    115deg,
    rgba(255, 255, 255, 0.22) 0%,
    rgba(255, 255, 255, 0) 35%,
    rgba(0, 0, 0, 0.08) 100%
  );
  pointer-events: none;
}

/* 暗色书 */
.book--dark {
  width: 7cqw;
  height: 52cqh;
  background: linear-gradient(
    180deg,
    var(--color-book-dark-1) 0%,
    var(--color-book-dark-2) 70%,
    var(--color-book-dark-edge) 100%
  );
  align-self: flex-end;
  transform: rotate(-1.5deg);
  transform-origin: bottom center;
}
.book--dark .book__lines {
  position: absolute;
  top: 22cqh;
  left: 1.6cqw;
  display: flex;
  flex-direction: column;
  gap: 1.2cqh;
  width: 4cqw;
}
.book--dark .book__lines span {
  display: block;
  height: 0.4cqh;
  background: var(--color-border-3);
  border-radius: 0.2cqh;
  opacity: 0.35;
}
.book--dark .book__lines span:nth-child(1) { width: 100%; }
.book--dark .book__lines span:nth-child(2) { width: 80%; }
.book--dark .book__lines span:nth-child(3) { width: 60%; }

/* 中间高书：人类简史 */
.book--sapiens {
  width: 9.5cqw;
  height: 60cqh;
  background: linear-gradient(
    180deg,
    var(--color-book-sapiens-1) 0%,
    var(--color-book-sapiens-2) 80%,
    var(--color-book-sapiens-edge) 100%
  );
  border: 0.06cqw solid var(--color-book-sapiens-edge);
  align-self: flex-start;
  transform: rotate(1.2deg);
  transform-origin: bottom center;
}
.book--sapiens .book__face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 10cqh;
  gap: 0.6cqh;
}
.book__title-zh {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(11px, 1.7cqw, 17px);
  font-weight: 700;
  color: var(--color-book-sapiens-ink);
  letter-spacing: 0.05em;
  text-shadow: 0 0.1cqh 0 rgba(255, 255, 255, 0.4);
}
.book__title-en {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(8px, 1.2cqw, 12px);
  font-weight: 600;
  color: var(--color-book-sapiens-ink);
  opacity: 0.7;
  letter-spacing: 0.08em;
}
.book__seal {
  width: 2cqw;
  height: 2cqw;
  border: 0.18cqw solid var(--color-book-sapiens-ink);
  border-radius: 50%;
  margin-top: 1cqh;
  opacity: 0.45;
  position: relative;
}
.book__seal::after {
  content: '';
  position: absolute;
  inset: 0.3cqw;
  background: var(--color-book-sapiens-ink);
  border-radius: 50%;
  opacity: 0.3;
}

/* 棕色书 */
.book--brown {
  width: 6.5cqw;
  height: 48cqh;
  background: linear-gradient(
    180deg,
    var(--color-book-brown-1) 0%,
    var(--color-book-brown-2) 80%,
    #6b3500 100%
  );
  align-self: flex-end;
  transform: rotate(-0.8deg);
  transform-origin: bottom center;
}
.book--brown .book__lines {
  position: absolute;
  top: 16cqh;
  left: 1.5cqw;
  display: flex;
  flex-direction: column;
  gap: 1.4cqh;
  width: 3.6cqw;
}
.book--brown .book__lines span {
  display: block;
  height: 0.4cqh;
  background: var(--color-book-brown-gold);
  border-radius: 0.2cqh;
  opacity: 0.65;
}
.book--brown .book__lines span:nth-child(1) { width: 100%; }
.book--brown .book__lines span:nth-child(2) { width: 75%; }

/* ============================================
 *  NAS 服务器
 * ============================================ */
.hero-entity--nas {
  left: 48cqw;
  top: 22cqh;
  width: 28cqw;
  height: 60cqh;
}
.hero-entity--nas svg {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 1cqh 1.2cqh rgba(15, 23, 42, 0.18));
}

/* ============================================
 *  4 个分类卡 (2x2)
 * ============================================ */
.hero-entity--cards {
  left: 72cqw;
  top: 5cqh;
  width: 26cqw;
  height: 46cqh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1.2cqw;
}

.hero-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1cqw;
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #fafbfd 100%
  );
  border: 0.1cqw solid var(--color-border-3);
  border-radius: 1.8cqw;
  box-shadow:
    0 0.4cqh 0.8cqh rgba(15, 23, 42, 0.06),
    0 0.2cqh 0.4cqh rgba(15, 23, 42, 0.04);
  overflow: visible;
}

/* 卡片底阴影 (在卡片下方) */
.hero-card__shadow {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: -0.4cqh;
  height: 0.8cqh;
  background: radial-gradient(
    ellipse at center,
    rgba(15, 23, 42, 0.12) 0%,
    rgba(15, 23, 42, 0) 70%
  );
  border-radius: 50%;
  z-index: -1;
}

.hero-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.4cqw;
  height: 4.4cqw;
  border-radius: 1.2cqw;
  position: relative;
  box-shadow: inset 0 0 0 0.06cqw rgba(255, 255, 255, 0.5);
}
.hero-card__icon svg {
  width: 62%;
  height: 62%;
}
.hero-card__icon--audio { background: var(--color-audio-bg); color: var(--color-audio); }
.hero-card__icon--comic { background: var(--color-comic-bg); color: var(--color-comic); }
.hero-card__icon--book  { background: var(--color-book-bg);  color: var(--color-book); }
.hero-card__icon--novel { background: var(--color-novel-bg); color: var(--color-novel); }

.hero-card__name {
  font-size: clamp(10px, 1.4cqw, 13px);
  font-weight: 600;
  color: var(--color-text-2);
  letter-spacing: 0.04em;
}

/* ============================================
 *  容器查询：超小尺寸时隐藏次要元素
 * ============================================ */
@container hero (max-width: 360px) {
  .hero-bg__cloud,
  .hero-bg__halo--2 { display: none; }
}

/* ============================================
 *  微交互动画关键帧
 * ============================================ */
@keyframes cloudDrift {
  from { transform: translateX(0); }
  to   { transform: translateX(1.8cqw); }
}

@keyframes haloPulse {
  from { opacity: 0.8; transform: scale(1); }
  to   { opacity: 1; transform: scale(1.06); }
}
</style>
