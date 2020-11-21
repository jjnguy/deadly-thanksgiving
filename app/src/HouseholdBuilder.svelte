<script lang="ts">
  import AddrPicker from "./AddrPicker.svelte";
  import {
    chanceForHouseholdToBeInfectedInPast,
    chanceForIndividualToBeInfectedInPast,
  } from "./covid";
  import type { HouseholdType } from "./types";

  export let household: HouseholdType;
</script>

<AddrPicker bind:addr={household.address} />
<span>Chance of individual being infected in past 14 days
  {(chanceForIndividualToBeInfectedInPast(14, household.address) * 100).toFixed(4)}%</span>
<h3>People</h3>
<input bind:value={household.size} type="number" min="1" />
<div>
  Chance of household being infected in past 14 days
  {(chanceForHouseholdToBeInfectedInPast(14, household) * 100).toFixed(4)}%
</div>
