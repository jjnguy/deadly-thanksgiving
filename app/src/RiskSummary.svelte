<script lang="ts">
  import { chanceForHouseholdsToBeInfectedInPast } from "./covid";

  import type { HouseholdType } from "./types";

  export let households: HouseholdType[];
</script>

<style>
  .feature {
    font-size: 1.3rem;
  }
</style>

<p class="feature">
  Chance of any guests being infected within the last 14 days:
  {(chanceForHouseholdsToBeInfectedInPast(14, households) * 100).toFixed(3)}%
</p>
