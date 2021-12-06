import { PlayerAPIAudio } from './PlayerAPIAudio'

type Props = {}

export const PlayerAPI = (props: Props) => {
  /* Never initialize PlayerAPIs on the server-side. */
  if (typeof window === 'undefined') {
    return null
  }

  return <PlayerAPIAudio />
}
