import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { convertToNowPlayingItem } from 'podverse-shared'
import Error from './_error'
import MediaHeaderCtrl from '~/components/MediaHeaderCtrl/MediaHeaderCtrl'
import MediaInfoCtrl from '~/components/MediaInfoCtrl/MediaInfoCtrl'
import MediaListCtrl from '~/components/MediaListCtrl/MediaListCtrl'
import Meta from '~/components/Meta/Meta'
import config from '~/config'
import PV from '~/lib/constants'
import { cookieGetQuery } from '~/lib/utility'
import { pageIsLoading, pagesSetQueryState } from '~/redux/actions'
import { getEpisodesByQuery, getMediaRefsByQuery, getPodcastById } from '~/services/'
import { withTranslation } from '~/../i18n'
const { PUBLIC_BASE_URL } = config()

type Props = {
  errorCode?: number
  lastScrollPosition?: number
  meta?: any
  pageKey: string
  pages?: any
  pagesSetQueryState?: any
  playerQueue?: any
  podcast?: any
  queryFrom?: any
  queryPage: number
  querySort?: any
  queryType?: any
  t?: any
  user?: any
  userSetInfo?: any
}

type State = {}

class Podcast extends Component<Props, State> {

  static async getInitialProps({ query, req, store, t }) {
    const pageKeyWithId = `${PV.pageKeys.podcast}${query.id}`
    const state = store.getState()
    const { pages, user } = state

    let podcastResult
    try {
      podcastResult = await getPodcastById(query.id)
    } catch (err) {
      store.dispatch(pageIsLoading(false))
      return { errorCode: err.response && err.response.status || 500 }
    }

    const podcast = podcastResult.data

    const localStorageQuery = cookieGetQuery(req, PV.pageKeys.podcast)

    const currentPage = pages[pageKeyWithId] || {}
    const lastScrollPosition = currentPage.lastScrollPosition
    const queryFrom = currentPage.queryFrom || query.from || localStorageQuery.from || PV.queryParams.from_podcast
    const queryPage = currentPage.queryPage || query.page || 1
    const querySort = currentPage.querySort || query.sort || localStorageQuery.sort || PV.queryParams.most_recent
    const queryType = currentPage.queryType || query.type || localStorageQuery.type || PV.queryParams.episodes
    let podcastId = ''

    if (queryFrom === PV.queryParams.from_podcast) {
      podcastId = podcast.id
    } else if (queryFrom === PV.queryParams.subscribed_only) {
      podcastId = user.subscribedPodcastIds
    }

    if (Object.keys(currentPage).length === 0) {
      let results

      if (queryType === PV.queryParams.episodes) {
        results = await getEpisodesByQuery({
          from: queryFrom,
          ...(!podcastId ? { includePodcast: true } : {}),
          page: queryPage,
          ...(podcastId ? { podcastId } : {}),
          sort: querySort,
          type: queryType
        })
      } else {
        results = await getMediaRefsByQuery({
          from: queryFrom,
          includeEpisode: true,
          page: queryPage,
          ...(podcastId ? { podcastId } : {}),
          sort: querySort,
          type: queryType,
          allowUntitled: true
        })
      }

      const listItems = results.data[0].map(x => {
        const item = convertToNowPlayingItem(x, {}, podcast)
        item.podcastId = podcast.id
        item.podcastFunding = podcast.funding
        item.podcastShrunkImageUrl = podcast.shrunkImageUrl
        item.podcastTitle = podcast.title
        item.podcastValue = podcast.value
        return item
      })
      
      store.dispatch(pagesSetQueryState({
        pageKey: pageKeyWithId,
        listItems,
        listItemsTotal: results.data[1],
        podcast,
        queryFrom,
        queryPage,
        querySort,
        queryType
      }))
    }

    store.dispatch(pageIsLoading(false))
    const podcastTitle = podcast.title || t('untitledPodcast')
    const meta = {
      currentUrl: PUBLIC_BASE_URL + PV.paths.web.podcast + '/' + podcast.id,
      description: podcast.description,
      imageAlt: podcastTitle,
      imageUrl: podcast.shrunkImageUrl,
      title: podcastTitle
    }
    const namespacesRequired = PV.nexti18next.namespaces

    return { lastScrollPosition, meta, namespacesRequired, pageKey: pageKeyWithId, podcast, queryFrom, queryPage,
      querySort, queryType }
  }

  render() {
    const { errorCode, meta, pageKey, pages, pagesSetQueryState, podcast } = this.props
    const page = pages[pageKey] || {}
    const { queryFrom, queryPage, querySort, queryType } = page

    if (errorCode) {
      return <Error statusCode={errorCode} />
    }

    return (
      <Fragment>
        <style>{`.media-info .media-info__description { margin-top: 0 }`}</style>
        <Meta
          description={meta.description}
          ogDescription={meta.description}
          ogImage={meta.imageUrl}
          ogTitle={meta.title}
          ogType='website'
          ogUrl={meta.currentUrl}
          robotsNoIndex={false}
          title={meta.title}
          twitterDescription={meta.description}
          twitterImage={meta.imageUrl}
          twitterImageAlt={meta.imageAlt}
          twitterTitle={meta.title} />
        <MediaHeaderCtrl
          pageKey={pageKey}
          podcast={podcast} />
        <MediaInfoCtrl
          initialShowDescription={true}
          pageKey={pageKey}
          podcast={podcast} />
        <MediaListCtrl
          allowUntitledClips={true}
          handleSetPageQueryState={pagesSetQueryState}
          includeOldest={queryType === PV.queryParams.episodes}
          pageKey={pageKey}
          podcast={podcast}
          podcastId={podcast.id}
          queryFrom={queryFrom}
          queryPage={queryPage}
          querySort={querySort}
          queryType={queryType}
          showQueryTypeSelect={true} />
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  pagesSetQueryState: bindActionCreators(pagesSetQueryState, dispatch)
})

export default connect<{}, {}, Props>(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(Podcast))
