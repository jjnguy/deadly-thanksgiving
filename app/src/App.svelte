<script lang="ts">
  import HouseholdBuilder from "./HouseholdBuilder.svelte";
  import {
    chanceForHouseholdsToBeInfectedInPast,
    getPop,
    listStates,
  } from "./covid";
  import type { HouseholdType } from "./types";

  let households: HouseholdType[] = [
    {
      size: 1,
      address: {},
      name: "Your House",
    },
  ];

  function addHousehold() {
    households = [
      ...households,
      {
        size: 1,
        address: {},
      },
    ];
  }
</script>

<style>
</style>

<main>
  <h1>Deadly Thanksgiving</h1>
  <div>
    Chance of any guests being infected within the last 14 days:
    {(chanceForHouseholdsToBeInfectedInPast(14, households) * 100).toFixed(4)}%
  </div>
  <h2>Households</h2>
  <ul>
    {#each households as household}
      <li>
        <HouseholdBuilder bind:household />
      </li>
    {/each}
  </ul>
  <button on:click={addHousehold}>add household</button>
</main>
