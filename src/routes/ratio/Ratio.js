/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, {Fragment} from 'react';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import s from './Ratio.css';
import gql from 'graphql-tag';
import {Mutation, Query} from 'react-apollo';

const colors = ['red', 'blue'];

const GQL_GET_PROJECTS = gql`
  query($userId: String!) {
    getCurrentProjects(userId: $userId) {
      projects {
        id
        name
        ratio
      }
    }
  }
`;

const GQL_UPDATE_RATIO = gql`
  mutation updateProjectRatio($userId: String!, $projectId: String!, $ratio: Int!) {
    updateProjectRatio(userId: $userId, projectId: $projectId, ratio: $ratio) {
      id
      name
      ratio
    }
  }
`;

const Bar = (props) => {
  const {projects} = props;
  return (
    <div style={{display: 'flex', backgroundColor: 'ghostwhite', marginBottom: 24,}}>
      {projects.map((p, i) => <div key={p.id}
                                   style={{
                                     flex: p.ratio,
                                     color: 'white',
                                     whiteSpace: 'nowrap',
                                     paddingLeft: 8,
                                     backgroundColor: colors[i],
                                     transition: 'flex .5s',
                                     overflow: 'hidden',
                                   }}>{p.name}</div>)}
    </div>
  );
};

class Ratio extends React.Component {
  constructor(props, context) {
    super(props);
  }

  render() {
    return (
      <div className={s.root}>
        <Query
          query={GQL_GET_PROJECTS}
          variables={{userId: 'a'}}
        >
          {({error, loading, data}) => {
            if (error) return <div>Errror!!</div>;
            if (loading) return <div>Loading</div>;

            const {projects} = data.getCurrentProjects;

            return (
              <Fragment>
                <Bar projects={projects}/>
                {projects.map((p, i) => (
                  <Mutation key={p.id}
                            mutation={GQL_UPDATE_RATIO}
                  >
                    {updateRatio => (
                      <div style={{display: 'flex'}}>
                        <div style={{display: 'flex'}}>
                          <div style={{padding: '0 8px', cursor: 'pointer'}}
                               onClick={(e) => {
                                 this.updateRatio(updateRatio, p, p.ratio + 1);
                               }}
                          >+
                          </div>
                          <input type="text"
                                 style={{width: '3em', textAlign: 'center'}}
                                 value={p.ratio}
                                 onChange={(e) => {
                                   this.updateRatio(updateRatio, p, Number(e.target.value));
                                 }}
                          />
                          <div style={{padding: '0 8px', cursor: 'pointer'}}
                               onClick={(e) => {
                                 this.updateRatio(updateRatio, p, p.ratio - 1);
                               }}
                          >-
                          </div>
                        </div>
                        <div>{`${p.id} - ${p.name}`}</div>
                      </div>
                    )}
                  </Mutation>
                ))}
              </Fragment>
            );
          }}
        </Query>
      </div>
    );
  }

  updateRatio(mutationFn, project, ratio) {
    mutationFn({
      variables: {userId: 'a', projectId: project.id, ratio},
      optimisticResponse: {
        updateProjectRatio: {
          ...project,
          // Here, this is what we want to render optimistically!
          ratio,
        },
      },
    });
  }
}

export default withStyles(s)(Ratio);
