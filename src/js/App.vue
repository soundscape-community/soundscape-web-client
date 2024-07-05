<template>
    <nav>
      <button class="nav-button"
        id="btn_callouts" title="Start tracking">
          <i class='fas'>&#xf124;</i>
      </button>
      <button
        class="nav-button"
        id="btn_near_me"
        title="Announce places near me"
      >
          ⓘ
      </button>

      <VoiceSelector />
      <RateSelector />

      <button class="nav-button">
        <a href="./help.html" title="FAQ page">
          <i class="fas fa-question" style="color: white;"></i>
        </a>
      </button>
    </nav>

    <main>
      <Map />
      <CalloutList />
    </main>
</template>

<script setup>
import CalloutList from './components/CalloutList.vue';
import Map from './components/Map.vue';
import RateSelector from './components/RateSelector.vue';
import VoiceSelector from './components/VoiceSelector.vue';
</script>

