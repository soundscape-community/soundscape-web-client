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

      <VoiceList />
      <SpeechRate />

      <button class="nav-button">
        <a href="./help.html" title="FAQ page">
          <i class="fas fa-question" style="color: white;"></i>
        </a>
      </button>
    </nav>

    <main>
      <Map />
      <RecentList />
    </main>
</template>

<script>
import Map from './components/Map.vue';
import RecentList from './components/RecentList.vue';
import SpeechRate from './components/SpeechRate.vue';
import VoiceList from './components/VoiceList.vue';

export default {
  name: 'App',
  components: {
    Map,
    RecentList,
    SpeechRate,
    VoiceList,
  },
};
</script>

