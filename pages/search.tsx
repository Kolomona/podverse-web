import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { ButtonGroup, Form, FormGroup, FormText, Input, InputGroup, InputGroupAddon } from 'reactstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, MediaListItem, Pagination } from 'podverse-ui'
import Meta from '~/components/Meta/Meta'
import config from '~/config'
import PV from '~/lib/constants'
import { enrichPodcastsWithCategoriesString, safeAlert } from '~/lib/utility'
import { modalsRequestPodcastShow, pageIsLoading, pagesSetQueryState } from '~/redux/actions'
import { getPodcastsByQuery } from '~/services'
import { withTranslation } from '~/../i18n'
import { RequestPodcastModal } from '~/components/RequestPodcastModal/RequestPodcastModal'
const uuidv4 = require('uuid/v4')
const { PUBLIC_BASE_URL, QUERY_PODCASTS_LIMIT } = config()

type Props = {
  lastScrollPosition?: number
  modals: any
  modalsRequestPodcastShow?: any
  pageIsLoading?: any
  pageKey?: string
  pages?: any
  pagesSetQueryState?: any
  settings?: any
  t?: any
}

type State = {
  currentSearch?: string
  searchCompleted?: boolean
}

class Search extends Component<Props, State> {

  static async getInitialProps({ query, req, store }) {
    store.dispatch(pageIsLoading(false))
    const state = store.getState()
    const { pages } = state

    const currentPage = pages[PV.pageKeys.search] || {}
    const lastScrollPosition = currentPage.lastScrollPosition
    const querySearchBy = currentPage.searchBy || query.searchBy || PV.queryParams.podcast

    store.dispatch(pagesSetQueryState({ 
      pageKey: PV.pageKeys.search,
      searchBy: querySearchBy
    }))

    const namespacesRequired = PV.nexti18next.namespaces

    return { lastScrollPosition, namespacesRequired, pageKey: PV.pageKeys.search }
  }

  constructor(props) {
    super(props)

    this.state = {
      currentSearch: '',
      searchCompleted: false
    }
  }

  handleSearchByChange = searchBy => {
    const { pagesSetQueryState } = this.props
    pagesSetQueryState({
      pageKey: PV.pageKeys.search,
      listItems: [],
      searchBy
    })

    this.setState({ searchCompleted: false })
  }

  handleSearchInputChange = event => {
    const { value: currentSearch } = event.target
    this.setState({
      currentSearch,
      searchCompleted: false
    })
  }

  queryPodcasts = async (page = 1) => {
    const { pages, pagesSetQueryState, t } = this.props
    const { searchBy } = pages[PV.pageKeys.search]
    const { currentSearch } = this.state
    
    if (!currentSearch) { return }

    const query = { 
      page,
      searchBy,
      searchText: currentSearch
    }

    pagesSetQueryState({
      pageKey: PV.pageKeys.search,
      isSearching: page === 1,
      queryPage: page,
      searchText: currentSearch
    })

    try {
      const response = await getPodcastsByQuery(query)
      const podcasts = response.data || []
      const enrichedPodcasts = enrichPodcastsWithCategoriesString(podcasts[0])

      pagesSetQueryState({
        pageKey: PV.pageKeys.search,
        isSearching: false,
        listItems: enrichedPodcasts,
        listItemsTotal: podcasts[1]        
      })

      this.setState({ searchCompleted: true })

    } catch (error) {
      console.log(error)
      safeAlert(t('SearchError'))
    }
  }

  linkClick = () => {
    const { pageIsLoading } = this.props
    pageIsLoading(true)
  }

  handleQueryPage = async page => {
    const { pageIsLoading } = this.props
    pageIsLoading(true)
    await this.queryPodcasts(page)
    pageIsLoading(false)

    const mediaListSelectsEl = document.querySelector('.search__by')
    if (mediaListSelectsEl) {
      mediaListSelectsEl.scrollIntoView()
    }
  }

  toggleRequestPodcastModal = () => {
    const { modals, modalsRequestPodcastShow } = this.props
    const { isOpen: requestPodcastIsOpen } = modals.requestPodcast
    modalsRequestPodcastShow({ isOpen: !requestPodcastIsOpen })
  }

  render() {
    const { modals, pages, t } = this.props
    const { isOpen: requestPodcastIsOpen } = modals.requestPodcast
    const { isSearching, listItems, listItemsTotal, queryPage, searchBy } = pages[PV.pageKeys.search]
    const { currentSearch, searchCompleted } = this.state

    const meta = {
      currentUrl: PUBLIC_BASE_URL + PV.paths.web.search,
      description: t('pages:search._Description'),
      title: t('pages:search._Title')
    }

    const placeholder = searchBy === PV.queryParams.host
      ? t('searchByHost') : t('searchByTitle')
      
    const listItemNodes = listItems ? listItems.map(x => {
      return (
        <MediaListItem
          dataPodcast={x}
          handleLinkClick={this.linkClick}
          hasLink={true}
          itemType='podcast-search-result'
          key={`podcast-list-item-${uuidv4()}`}
          t={t} />
      )
    }) : null

    return (
      <Fragment>
        <Meta
          description={meta.description}
          ogDescription={meta.description}
          ogTitle={meta.title}
          ogType='website'
          ogUrl={meta.currentUrl}
          robotsNoIndex={false}
          title={meta.title}
          twitterDescription={meta.description}
          twitterTitle={meta.title} />
        <h3>{t('Search')}</h3>
        <Form
          autoComplete='off'
          className='search'>
          <FormGroup>
            <ButtonGroup
              className='search__by'>
              <Button
                className='search-by__podcast'
                color='secondary'
                isActive={searchBy === 'podcast'}
                onClick={() => this.handleSearchByChange('podcast')}
                outline>
                {t('Podcast')}
              </Button>
              <Button
                className='search-by__host'
                color='secondary'
                isActive={searchBy === 'host'}
                onClick={() => this.handleSearchByChange('host')}
                outline>
                {t('Host')}
              </Button>
            </ButtonGroup>
            <InputGroup>
              <Input
                aria-label='Search input'
                className='search__input'
                name='search'
                onChange={this.handleSearchInputChange}
                onKeyPress={target => {
                  if (target.charCode === 13) {
                    target.nativeEvent.preventDefault()
                    this.queryPodcasts()
                  }
                }}
                placeholder={placeholder}
                type='text'
                value={currentSearch} />
              <InputGroupAddon addonType='append'>
                <Button
                  className='search__input-btn'
                  color='primary'
                  isLoading={isSearching}
                  onClick={() => this.queryPodcasts()}>
                  <FontAwesomeIcon icon='search' />
                </Button>
              </InputGroupAddon>
            </InputGroup>
            {
              searchBy === PV.queryParams.podcast &&
                <FormText>{t('Wrap your search in double quotes for more exact matches')}</FormText>
            }
          </FormGroup>
        </Form>
        <div className={'search-media-list'}>
          {
            listItemNodes && listItemNodes.length > 0 &&
            <Fragment>
              {listItemNodes}
              <Pagination
                currentPage={queryPage || 1}
                handleQueryPage={this.handleQueryPage}
                pageRange={2}
                t={t}
                totalPages={Math.ceil(listItemsTotal / QUERY_PODCASTS_LIMIT)} />
            </Fragment>
          }
          {
            (!isSearching && searchCompleted && listItemNodes && listItemNodes.length === 0) &&
              <div className='no-results-msg'>
                {t('No podcasts found')}
              </div>
          }
          {
            !isSearching &&
              <a
                className='request-podcast'
                onClick={this.toggleRequestPodcastModal}>
                {t('RequestAPodcast')}
              </a>
          }
        </div>
        <RequestPodcastModal
          handleHideModal={this.toggleRequestPodcastModal}
          isOpen={requestPodcastIsOpen}
          t={t}
        />
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  modalsRequestPodcastShow: bindActionCreators(modalsRequestPodcastShow, dispatch),
  pageIsLoading: bindActionCreators(pageIsLoading, dispatch),
  pagesSetQueryState: bindActionCreators(pagesSetQueryState, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(Search))