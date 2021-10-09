
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Pagination } from 'podverse-ui'
import MediaListItemCtrl from '~/components/MediaListItemCtrl/MediaListItemCtrl'
import config from '~/config'
import PV from '~/lib/constants'
import { getViewContentsElementScrollTop } from '~/lib/utility'
import { pageIsLoading, pagesSetQueryState } from '~/redux/actions'
import { getPublicUsersByQuery } from '~/services'
import { withTranslation } from 'i18n'
const uuidv4 = require('uuid/v4')
const { QUERY_MEDIA_REFS_LIMIT } = config()

type Props = {
  handleSetPageQueryState: Function
  pageIsLoading?: any
  pageKey: string
  pages?: any
  pagesSetQueryState?: any
  queryPage?: number
  settings?: any
  t?: any
  user?: any
}

type State = {}

class UserListCtrl extends Component<Props, State> {

  static defaultProps: Props = {
    handleSetPageQueryState: () => { },
    pageKey: 'default',
    queryPage: 1
  }

  queryUserListItems = async (page = 1) => {
    const { handleSetPageQueryState, pageKey, user } = this.props

    const query: any = { page }

    handleSetPageQueryState({
      pageKey,
      queryPage: page
    })

    try {
      query.userIds = user.subscribedUserIds

      const response = await getPublicUsersByQuery(query)
      const users = response.data

      handleSetPageQueryState({
        pageKey,
        listItems: users[0],
        listItemsTotal: users[1]
      })
    } catch (error) {
      console.log(error)
    }
  }

  linkClick = () => {
    const { pageIsLoading, pageKey, pagesSetQueryState } = this.props
    pageIsLoading(true)

    const scrollPos = getViewContentsElementScrollTop()
    pagesSetQueryState({
      pageKey,
      lastScrollPosition: scrollPos
    })
  }

  handleQueryPage = async page => {
    const { pageIsLoading } = this.props
    pageIsLoading(true)
    await this.queryUserListItems(page)
    pageIsLoading(false)

    const mediaListSelectsEl = document.querySelector('.media-list__selects')
    if (mediaListSelectsEl) {
      mediaListSelectsEl.scrollIntoView()
    }
  }

  render() {
    const { pageKey, pages, t, user } = this.props
    const { listItems, listItemsTotal, queryPage } = pages[pageKey]

    const listItemNodes = listItems && listItems.map(x => {
      return (
        <MediaListItemCtrl
          key={`media-list-item-${uuidv4()}`}
          mediaListItemType='user'
          pageKey={pageKey}
          profileUser={x} />
      )
    })

    const isNotLoggedIn = !user || !user.id
    const noResultsFoundMsg = isNotLoggedIn ? t('LoginToViewYourProfiles') : t('No profiles found')

    return (
      <div className='media-list reduced-margin'>
        {
          listItemNodes && listItemNodes.length > 0 &&
            <Fragment>
              {listItemNodes}
              <Pagination
                currentPage={queryPage || 1}
                handleQueryPage={this.handleQueryPage}
                pageRange={2}
                t={t}
                totalPages={Math.ceil(listItemsTotal / QUERY_MEDIA_REFS_LIMIT)} />
            </Fragment>
        }
        {
          (!listItemNodes || listItemNodes.length === 0) &&
          <div className='no-results-msg'>
            <div className='no-results-msg'>{noResultsFoundMsg}</div>
          </div>
        }
      </div>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  pageIsLoading: bindActionCreators(pageIsLoading, dispatch),
  pagesSetQueryState: bindActionCreators(pagesSetQueryState, dispatch)
})

export default connect<{}, {}, Props>(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(UserListCtrl))