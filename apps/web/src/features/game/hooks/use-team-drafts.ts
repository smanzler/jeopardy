import { useState } from "react"
import { buildTeamNames } from "@/lib/score"

export const MIN_TEAM_COUNT = 2

export const MAX_TEAM_COUNT = 8

/** The id keeps the field of a team when a team before it goes away. */
export type TeamDraft = { id: string; name: string }

const buildTeamDraft = (): TeamDraft => ({ id: crypto.randomUUID(), name: "" })

/** Holds the teams that the host names before the game starts. */
export const useTeamDrafts = () => {
  const [teams, setTeams] = useState(() =>
    Array.from({ length: MIN_TEAM_COUNT }, buildTeamDraft)
  )

  return {
    teams,
    /** A blank name becomes the team number. */
    teamNames: buildTeamNames(teams.map((team) => team.name)),
    add: () => setTeams((current) => [...current, buildTeamDraft()]),
    remove: (id: string) =>
      setTeams((current) => current.filter((team) => team.id !== id)),
    rename: ({ id, name }: TeamDraft) =>
      setTeams((current) =>
        current.map((team) => (team.id === id ? { id, name } : team))
      ),
  }
}

export type TeamDrafts = ReturnType<typeof useTeamDrafts>
