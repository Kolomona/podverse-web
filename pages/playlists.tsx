import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import OmniAural, { useOmniAural } from 'omniaural'
import type { Playlist } from 'podverse-shared'
import {
  Footer,
  List,
  MessageWithAction,
  Meta,
  PageHeader,
  PageScrollableContent,
  PlaylistListItem
} from '~/components'
import { Page } from '~/lib/utility/page'
import { PV } from '~/resources'
import { getServerSideLoggedInUserPlaylistsCombined } from '~/services/playlist'
import { getDefaultServerSideProps } from '~/services/serverSideHelpers'
import { OmniAuralState } from '~/state/omniauralState'

interface ServerProps extends Page {
  serverPlaylistsCombined: {
    createdPlaylists: Playlist[]
    subscribedPlaylists: Playlist[]
  }
}

const keyPrefix = 'pages_playlists'

export default function Playlists({ serverPlaylistsCombined }: ServerProps) {
  /* Initialize */

  const { t } = useTranslation()
  const [userInfo] = useOmniAural('session.userInfo') as [OmniAuralState['session']['userInfo']]
  const { createdPlaylists, subscribedPlaylists } = serverPlaylistsCombined
  const combinedPlaylists = createdPlaylists.concat(subscribedPlaylists)

  /* Render Helpers */

  const generatePlaylistElements = (listItems: Playlist[]) => {
    return listItems.map((listItem, index) => (
      <PlaylistListItem key={`${keyPrefix}-${index}-${listItem.id}`} playlist={listItem} />
    ))
  }

  /* Meta Tags */

  const meta = {
    currentUrl: `${PV.Config.WEB_BASE_URL}${PV.RoutePaths.web.playlists}`,
    description: t('pages-about_Description'),
    title: t('pages-playlists_Title')
  }

  return (
    <>
      <Meta
        description={meta.description}
        ogDescription={meta.description}
        ogTitle={meta.title}
        ogType='website'
        ogUrl={meta.currentUrl}
        robotsNoIndex={false}
        title={meta.title}
        twitterDescription={meta.description}
        twitterTitle={meta.title}
      />
      <PageHeader text={t('Playlists')} noMarginBottom />
      <PageScrollableContent noPaddingTop>
        {!userInfo && (
          <MessageWithAction
            actionLabel={t('Login')}
            actionOnClick={() => OmniAural.modalsLoginShow()}
            message={t('LoginToViewYourPlaylists')}
          />
        )}
        {userInfo && <List>{generatePlaylistElements(combinedPlaylists)}</List>}
        <Footer />
      </PageScrollableContent>
    </>
  )
}

/* Server-Side Logic */

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, locale } = ctx
  const { cookies } = req

  const defaultServerProps = await getDefaultServerSideProps(ctx, locale)
  const combinedPlaylists = await getServerSideLoggedInUserPlaylistsCombined(cookies)

  const serverProps: ServerProps = {
    ...defaultServerProps,
    serverPlaylistsCombined: combinedPlaylists
  }

  return { props: serverProps }
}
