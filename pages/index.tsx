import { GetServerSideProps } from 'next'
import { Podcast } from 'podverse-shared'
import { Page } from '~/lib/utility/page'
import Podcasts from './podcasts'
import { PV } from '~/resources'
import { getPodcastsByQuery } from '~/services/podcast'
import { getDefaultServerSideProps } from '~/services/serverSideHelpers'

export default Podcasts

interface ServerProps extends Page {
  serverFilterFrom: string
  serverFilterPage: number
  serverFilterSort: string
  serverPodcastsListData: Podcast[]
  serverPodcastsListDataCount: number
}

/* Server-Side Logic */
/* NOTE: This logic is identical to the getServerSideProps in /pages/podcasts.tsx */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale } = ctx

  const defaultServerProps = await getDefaultServerSideProps(ctx, locale)
  const { serverUserInfo } = defaultServerProps

  const serverFilterFrom = serverUserInfo ? PV.Filters.from._subscribed : PV.Filters.from._all
  const serverFilterSort = serverUserInfo ? PV.Filters.sort._alphabetical : PV.Filters.sort._topPastDay

  const serverFilterPage = 1
  let response = null
  if (serverUserInfo) {
    response = await getPodcastsByQuery({
      podcastIds: serverUserInfo.subscribedPodcastIds,
      sort: serverFilterSort
    })
  } else {
    response = await getPodcastsByQuery({
      sort: serverFilterSort
    })
  }

  const [podcastsListData, podcastsListDataCount] = response.data

  const serverProps: ServerProps = {
    ...defaultServerProps,
    serverFilterFrom,
    serverFilterPage,
    serverFilterSort,
    serverPodcastsListData: podcastsListData,
    serverPodcastsListDataCount: podcastsListDataCount
  }

  return { props: serverProps }
}
