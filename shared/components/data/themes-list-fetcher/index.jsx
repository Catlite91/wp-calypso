/**
 * External dependencies
 */
import React from 'react';
import pick from 'lodash/object/pick';
import omit from 'lodash/object/omit';
import once from 'lodash/function/once';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Constants from 'lib/themes/constants';
import * as allActions from 'lib/themes/actions';
import { getThemeById } from 'lib/themes/reducers/themes';
import { getThemesList, getQueryParams, isLastPage, isFetchingNextPage } from 'lib/themes/reducers/themes-list';

const actions = pick( allActions, [
	'query',
	'fetchNextPage',
	'incrementThemesPage',
	'fetchThemes',
	'fetchJetpackThemes',
] );

function getThemesState( state ) {
	return {
		themes: getThemesInList( state ),
		lastPage: isLastPage( state.themesList ),
		loading: isFetchingNextPage( state.themesList )
		//search: getQueryParams( state.themesList ).search
	};
}

function getThemesInList( state ) {
	return getThemesList( state.themesList ).map( themeId =>
		getThemeById( state.themes, themeId ) );
}

const ThemesListFetcher = React.createClass( {
	propTypes: {
		children: React.PropTypes.element.isRequired,
		site: React.PropTypes.oneOfType( [
			React.PropTypes.object,
			React.PropTypes.bool
		] ).isRequired,
		isMultisite: React.PropTypes.bool,
		search: React.PropTypes.string,
		tier: React.PropTypes.string,
		onRealScroll: React.PropTypes.func,
		onLastPage: React.PropTypes.func,

		themes: React.PropTypes.array.isRequired,
		lastPage: React.PropTypes.bool.isRequired,
		loading: React.PropTypes.bool.isRequired,
		query: React.PropTypes.func.isRequired,
		fetchNextPage: React.PropTypes.func.isRequired,
		incrementThemesPage: React.PropTypes.func.isRequired,
		fetchThemes: React.PropTypes.func.isRequired,
		fetchJetpackThemes: React.PropTypes.func.isRequired,
	},

	componentDidMount: function() {
		this.refresh( this.props );
	},

	componentWillReceiveProps: function( nextProps ) {
		console.log( 'prop-search-2', nextProps.search );
		const propKeys = [ 'search', 'tier' ];

		if ( propKeys.some( key => this.props[ key ] !== nextProps[ key ] ) ) {
			console.log( 'props changed' );
			this.refresh( nextProps );
		}
	},

	refresh: function( props ) {
		if ( this.props.site || this.props.isMultisite ) {
			this.queryThemes( props );
		}
	},

	queryThemes: function( props ) {
		const {
			onLastPage,
			site,
			search,
			tier,

			query,
			fetchNextPage
		} = props;

		this.onLastPage = onLastPage ? once( onLastPage ) : null;

		query( {
			search,
			tier,
			page: 0,
			perPage: Constants.PER_PAGE,
		} );

		fetchNextPage( site );
	},

	fetchNextPage: function( options ) {
		// FIXME: While this function is passed on by `ThemesList` to `InfiniteList`,
		// which has a `shouldLoadNextPage()` check (in scroll-helper.js), we can't
		// rely on that; fetching would break without the following check.
		if ( this.props.loading || this.props.lastPage ) {
			return;
		}

		const {
			site = false,
			onRealScroll = () => null,

			// actions assumed bound to dispatch
			incrementThemesPage,
			fetchThemes,
			fetchJetpackThemes,
		} = this.props;

		if ( options.triggeredByScroll ) {
			onRealScroll();
		}

		const fetcher = site.jetpack ? fetchJetpackThemes : fetchThemes;
		incrementThemesPage( site );
		fetcher( site );
	},

	render: function() {
		const props = omit( this.props, 'children' );
		return React.cloneElement( this.props.children, Object.assign( {}, props, {
			fetchNextPage: this.fetchNextPage
		} ) );
	}

} );

function propagateAndMerge( state, props ) {
	console.log( 'prop-search-1', props.search );
	return Object.assign( {}, props, getThemesState( state.themes ) );
}

module.exports = connect(
	propagateAndMerge,
	bindActionCreators.bind( null, actions )
)( ThemesListFetcher );
