import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { convertToNowPlayingItem } from 'podverse-shared'
import Error from './_error'
import Meta from '~/components/Meta/Meta'
import UserHeaderCtrl from '~/components/UserHeaderCtrl/UserHeaderCtrl'
import UserMediaListCtrl from '~/components/UserMediaListCtrl/UserMediaListCtrl'
import config from '~/config'
import PV from '~/lib/constants'
import { pageIsLoading, pagesSetQueryState } from '~/redux/actions'
import { getPodcastsByQuery, getPublicUser, getUserMediaRefs, getUserPlaylists
  } from '~/services'
import { withTranslation } from '~/../i18n'
const { PUBLIC_BASE_URL } = config()

type Props = {
  errorCode?: number
  lastScrollPosition?: number
  listItems?: any[]
  pageKey?: string
  pagesSetQueryState?: any
  publicUser?: any
  queryPage?: number
  querySort?: string
  queryType?: string
  t?: any
  user?: any
}

type State = {}

class Profile extends Component<Props, State> {

  static async getInitialProps({ query, req, store, t }) {
    const pageKeyWithId = `${PV.pageKeys.profile}${query.id}`
    const state = store.getState()
    const { pages } = state

    const currentId = query.id
    const currentPage = pages[pageKeyWithId] || {}
    const lastScrollPosition = currentPage.lastScrollPosition
    const queryPage = currentPage.queryPage || query.page || 1
    const querySort = currentPage.querySort || query.sort || PV.queryParams.alphabetical
    const queryType = currentPage.queryType || query.type || PV.queryParams.podcasts
    let publicUser = currentPage.publicUser

    if (Object.keys(currentPage).length === 0) {
      let userResult
      try {
        userResult = await getPublicUser(currentId)
      } catch (err) {
        store.dispatch(pageIsLoading(false))
        return { errorCode: err.response && err.response.status || 500 }
      }

      publicUser = userResult.data

      let queryDataResult
      let listItems = []

      if (query.type === PV.queryParams.clips) {
        queryDataResult = await getUserMediaRefs(currentId, querySort, queryPage)
        listItems = queryDataResult.data.map(x => convertToNowPlayingItem(x))
      } else if (query.type === PV.queryParams.playlists) {
        queryDataResult = await getUserPlaylists(currentId, queryPage)
        listItems = queryDataResult.data
      } else if (queryType === PV.queryParams.podcasts 
          && publicUser.subscribedPodcastIds
          && publicUser.subscribedPodcastIds.length > 0) {
        queryDataResult = await getPodcastsByQuery({
          from: PV.queryParams.subscribed_only,
          sort: querySort,
          subscribedPodcastIds: publicUser.subscribedPodcastIds
        })
        listItems = queryDataResult.data
      }

      store.dispatch(pagesSetQueryState({
        pageKey: pageKeyWithId,
        listItems: listItems[0],
        listItemsTotal: listItems[1],
        publicUser,
        queryPage,
        querySort,
        queryType
      }))
    }

    store.dispatch(pageIsLoading(false))

    const namespacesRequired = PV.nexti18next.namespaces

    return { lastScrollPosition, namespacesRequired, pageKey: pageKeyWithId, publicUser }
  }

  render() {
    const { errorCode, pageKey, pagesSetQueryState, publicUser,
      queryPage, querySort, queryType, t, user } = this.props

    let meta = {} as any
    if (publicUser) {
      meta = {
        currentUrl: PUBLIC_BASE_URL + PV.paths.web.profile + '/' + publicUser.id,
        description: `${publicUser.name ? publicUser.name : t('Anonymous')}`,
        title: `${publicUser.name ? publicUser.name : t('Anonymous')}`
      }
    }

    if (errorCode) {
      return <Error statusCode={errorCode} />
    }

    return (
      <div className='user-profile'>
        <Meta
          description={meta.description}
          ogDescription={meta.description}
          ogTitle={meta.title}
          ogType='website'
          ogUrl={meta.currentUrl}
          robotsNoIndex={!publicUser.isPublic}
          title={meta.title}
          twitterDescription={meta.description}
          twitterTitle={meta.title} />
        <h3>{t('Profile')}</h3>
        {
          publicUser &&
            <Fragment>
              <UserHeaderCtrl 
                loggedInUser={user}
                profileUser={publicUser} />
              <UserMediaListCtrl
                handleSetPageQueryState={pagesSetQueryState}
                loggedInUser={user}
                pageKey={pageKey}
                profileUser={publicUser}
                queryPage={queryPage}
                querySort={querySort}
                queryType={queryType} />
            </Fragment>
        }
      </div>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  pagesSetQueryState: bindActionCreators(pagesSetQueryState, dispatch)
})

export default connect<{}, {}, Props>(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(Profile))
