import FindAll from '../../application/use_cases/post/findAll';
import AddPost from '../../application/use_cases/post/add';
import FindById from '../../application/use_cases/post/findById';
import UpdateById from '../../application/use_cases/post/updateById';
import DeletePost from '../../application/use_cases/post/deleteΒyId';

export default function PostController(
  PostDbRepository,
  PostDbRepositoryImplementation,
  CachingClient,
  PostCachingRepository,
  PostCachingRepositoryImplementation
) {
  const repository = PostDbRepository(PostDbRepositoryImplementation());
  const cachingRepository = PostCachingRepository(PostCachingRepositoryImplementation()(CachingClient));

  const fetchAllPosts = (req, res, next) => {
    FindAll(repository)
      .then(posts => {
        const cachingOptions = {
          key: 'posts_',
          expireTimeSec: 120,
          data: JSON.stringify(posts)
        };
        // cache the result to redis
        cachingRepository.setCache(cachingOptions);
        return res.json(posts);
      })
      .catch((error) => next(error));
  };

  const fetchPostById = (req, res, next) => {
    FindById(req.params.id, repository)
      .then((post) => res.json(post))
      .catch((error) => next(error));
  };

  const addNewPost = (req, res, next) => {
    const { title, description, createdAt, isPublished, userId } = req.body;
    AddPost(title, description, createdAt, isPublished, userId, repository)
      .then((post) => {
        const cachingOptions = {
          key: 'posts_',
          expireTimeSec: 120,
          data: JSON.stringify(post)
        };
        // cache the result to redis
        cachingRepository.setCache(cachingOptions);
        return res.json('post added');
      })
      .catch((error) => next(error));
  };

  const deletePostById = (req, res, next) => {
    DeletePost(req.params.id, repository)
      .then((message) => res.json(message))
      .catch((error) => next(error));
  };

  const updatePostById = (req, res, next) => {
    const { title, description, createdAt, isPublished, userId } = req.body;
    UpdateById(req.params.id, title, description, createdAt, userId, isPublished, repository)
      .then((message) => res.json(message))
      .catch((error) => next(error));
  };

  return {
    fetchAllPosts,
    addNewPost,
    fetchPostById,
    updatePostById,
    deletePostById
  };
}
