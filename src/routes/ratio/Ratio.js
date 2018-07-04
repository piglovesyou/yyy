// @flow

import React from 'react';
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import s from './Ratio.css';

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

const Bar = (props: {|
  projects: Array<any>,
|}) => {
  const { projects } = props;
  return (
    <div style={{ display: 'flex', backgroundColor: 'ghostwhite', marginBottom: 24 }}>
      {projects.map((p, i) => <button key={p.id}
                                   style={{
                                     flex: p.ratio,
                                     color: 'white',
                                     whiteSpace: 'nowrap',
                                     paddingLeft: 8,
                                     backgroundColor: colors[i],
                                     transition: 'flex .5s',
                                     overflow: 'hidden',
                                   }}>{p.name}</button>)}
    </div>
  );
};

class Ratio extends React.Component {
  render() {
    return (
      <div className={s.root}>
        <Query
          query={GQL_GET_PROJECTS}
          variables={{ userId: 'a' }}
        >
          {({ error, loading, data }) => {
            if (error) return <div>Errror!!</div>;
            if (loading) return <div>Loading</div>;

            const { projects } = data.getCurrentProjects;

            return (
              <React.Fragment>
                <Bar projects={projects}/>
                {projects.map(p => (
                  <Mutation key={p.id}
                            mutation={GQL_UPDATE_RATIO}
                  >
                    {updateRatio => (
                      <div style={{ display: 'flex' }}>
                        <div style={{ display: 'flex' }}>
                          <button style={{ padding: '0 8px', cursor: 'pointer' }}
                               onClick={() => {
                                 processUpdateRatio(updateRatio, p, p.ratio + 1);
                               }}
                          >+
                          </button>
                          <input type="text"
                                 style={{ width: '3em', textAlign: 'center' }}
                                 value={p.ratio}
                                 onChange={(e) => {
                                   processUpdateRatio(updateRatio, p, Number(e.target.value));
                                 }}
                          />
                          <button style={{ padding: '0 8px', cursor: 'pointer' }}
                               onClick={() => {
                                 processUpdateRatio(updateRatio, p, p.ratio - 1);
                               }}
                          >-
                          </button>
                        </div>
                        <div>{`${p.id} - ${p.name}`}</div>
                      </div>
                    )}
                  </Mutation>
                ))}
              </React.Fragment>
            );
          }}
        </Query>
      </div>
    );
  }
}

function processUpdateRatio(mutationFn, project, ratio) {
  mutationFn({
    variables: { userId: 'a', projectId: project.id, ratio },
    optimisticResponse: {
      updateProjectRatio: {
        ...project,
        // Here, this is what we want to render optimistically!
        ratio,
      },
    },
  });
}

export default withStyles(s)(Ratio);
