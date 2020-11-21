<script lang="ts">
  import HouseholdBuilder from "./HouseholdBuilder.svelte";
  import { getPop, listStates } from "./covid";
  import type { HouseholdType } from "./types";

  let households: HouseholdType[] = [
    {
      name: "Your Household",
      people: [
        {
          name: "You",
          age: null,
        },
      ],
      address: {},
    },
  ];

  function addHousehold() {
    households = [
      ...households,
      {
        name: "New Household",
        people: [],
        address: {},
      },
    ];
  }
</script>

<style>
</style>

<main>
  <h1>Deadly Thanksgiving</h1>
  <h2>Households</h2>
  <ul>
    {#each households as household}
      <li>
        <HouseholdBuilder
          bind:people={household.people.length}
          name={household.name} />
      </li>
    {/each}
  </ul>
  <button on:click={addHousehold}>add household</button>
  <div>Risk:</div>
</main>
